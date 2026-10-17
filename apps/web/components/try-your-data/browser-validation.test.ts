import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { deflateRawSync } from "node:zlib";
import { createHash, webcrypto } from "node:crypto";
import { Blob as NodeBlob } from "node:buffer";
import template from "./browser-template.json";
import { cents, validateBrowserPackage } from "./browser-validation";
import { crc32, readFlatZip, storedZip } from "./browser-archive";
import { csvRows, strictJson } from "./browser-parser";
beforeAll(() => { vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("Blob", NodeBlob); });
afterAll(() => vi.unstubAllGlobals());
const encode = (text: string) => new TextEncoder().encode(text);
const files = () => Object.entries(template).map(([name, text]) => ({ name, bytes: encode(text) }));
const changed = (name: string, text: string) => files().map(f => f.name === name ? { name, bytes: encode(text) } : f);
async function codes(name: string, text: string) { return (await validateBrowserPackage(changed(name, text))).issues.map(i => i.code); }
describe("browser-local controlled package", () => {
  it("checks the canonical Harbor template with provenance and no network", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    try {
      const report = await validateBrowserPackage(files());
      expect(report.status).toBe("READY"); expect(report.files).toHaveLength(8);
      expect(report.files[0].sha256).toBe(createHash("sha256").update(files()[0].bytes).digest("hex"));
      expect(JSON.stringify(report)).not.toContain("Harbor Light"); expect(fetch).not.toHaveBeenCalled();
      expect(report).not.toHaveProperty("package_id"); expect(report).not.toHaveProperty("session_id");
    } finally { vi.unstubAllGlobals(); vi.stubGlobal("crypto", webcrypto); vi.stubGlobal("Blob", NodeBlob); }
  });
  it("uses exact integer cents at and beyond floating point precision", () => {
    expect(cents("999999999999999999.99", "total") + cents("0.01", "total")).toBe(cents("1000000000000000000.00", "total"));
    for (const value of ["1e3", "0.001", "NaN", "Infinity", "1000000000000000000.01", 100, true, " 1.00"]) expect(() => cents(value, "total")).toThrow();
  });
  it("blocks missing, duplicate and unsupported filenames without echoing hostile values", async () => {
    expect((await validateBrowserPackage(files().slice(1))).issues.some(i => i.code === "MISSING_FILE")).toBe(true);
    expect((await validateBrowserPackage([...files(), files()[0]])).issues.some(i => i.code === "DUPLICATE_FILENAME")).toBe(true);
    const hostile = "<script>steal()</script>.csv";
    const report = await validateBrowserPackage([...files().slice(1), { name: hostile, bytes: encode("x") }]);
    expect(report.status).toBe("BLOCKED"); expect(JSON.stringify(report)).not.toContain(hostile);
  });
  it("enforces byte, count, row, column and cell limits", async () => {
    expect((await validateBrowserPackage(Array.from({ length: 10 }, () => files()[0]))).status).toBe("BLOCKED");
    expect(await codes("customers.csv", "x".repeat(262145))).toContain("FILE_TOO_LARGE");
    expect(await codes("customers.csv", "id,display_name\n" + Array.from({ length: 1001 }, (_, i) => `c${i},Name`).join("\n"))).toContain("ROW_LIMIT");
    expect(await codes("customers.csv", Array.from({ length: 33 }, (_, i) => `c${i}`).join(","))).toContain("TOO_MANY_COLUMNS");
    expect(await codes("customers.csv", "id,display_name\nc1," + "x".repeat(8193))).toContain("TEXT_TOO_LONG");
  });
  it.each([
    ["id\nc1", "MISSING_COLUMN"], ["id,id,display_name\nc1,c1,Name", "DUPLICATE_HEADER"],
    ["id,Display Name\nc1,Name", "INVALID_HEADER"], ["id,display_name\nc1,Name,extra", "MALFORMED_ROW"],
    ["id,display_name\nc1,", "MISSING_VALUE"], ["id,display_name\nc1,Name\nc1,Other", "DUPLICATE_ID"],
    ["id,display_name\n../x,Name", "INVALID_IDENTIFIER"], ["id,display_name\nc1,\"unclosed", "MALFORMED_CSV"],
    ["id,display_name\nc1,\u202Ehidden", "HIDDEN_CHARACTERS"], ["%PDF-1.3", "BINARY_CONTENT"],
  ])("rejects CSV hazard %s", async (text, code) => { expect(await codes("customers.csv", text)).toContain(code); });
  it("rejects malformed UTF-8", async () => {
    const report = await validateBrowserPackage(files().map(f => f.name === "customers.csv" ? { ...f, bytes: new Uint8Array([0xff, 0xfe]) } : f));
    expect(report.issues.map(i => i.code)).toContain("INVALID_ENCODING");
  });
  it("reports reference and account-role failures at the correct record", async () => {
    expect(await codes("invoices.csv", "id,customer_id,receivable_account_id,document_number,total\ni1,missing,account-ar,I-1,10.00")).toContain("BROKEN_REFERENCE");
    const report = await validateBrowserPackage(changed("invoices.csv", "id,customer_id,receivable_account_id,document_number,total\ni1,customer-001,account-ap,I-1,10.00"));
    expect(report.issues.find(i => i.code === "ACCOUNT_ROLE")).toMatchObject({ file: "invoices.csv", row: 2, column: "receivable_account_id" });
  });
  it("blocks unbalanced journals, invalid dates and missing ledger evidence", async () => {
    const csv = (date: string) => `id,transaction_date,entries\nt1,${date},"${JSON.stringify([{ account_id: "account-bank", debit: "10.01", credit: "0" }, { account_id: "account-ap", debit: "0", credit: "10.00" }]).replaceAll('"', '""')}"`;
    expect(await codes("transactions.csv", csv("2026-01-31"))).toContain("UNBALANCED_JOURNAL");
    expect(await codes("transactions.csv", csv("2026-02-30"))).toContain("INVALID_DATE");
    expect(await codes("transactions.csv", "id,transaction_date,entries\n")).toContain("ACCOUNTING_EVIDENCE");
  });
  it("warns about excluded columns without retaining their values", async () => {
    const report = await validateBrowserPackage(changed("customers.csv", template["customers.csv"].trimEnd().split(/\r?\n/).map((line, index) => line + (index ? ",private-prompt-do-this" : ",memo")).join("\r\n") + "\r\n"));
    expect(report.status).toBe("NEEDS ATTENTION"); expect(report.issues.some(i => i.code === "IGNORED_FIELDS")).toBe(true); expect(JSON.stringify(report)).not.toContain("private-prompt-do-this");
  });
  it("rejects injected authority, unsupported settings, tax types and duplicate configuration keys", async () => {
    const base = JSON.parse(template["configuration.json"]);
    expect(await codes("configuration.json", JSON.stringify({ ...base, approved: true }))).toContain("UNSUPPORTED_KEY");
    expect(await codes("configuration.json", JSON.stringify({ ...base, settings: { ...base.settings, integrations: "LIVE_WRITE" } }))).toContain("INVALID_VALUE");
    expect(await codes("configuration.json", JSON.stringify({ ...base, taxes: [{ id: "t1", code: "NONE", jurisdiction: "Test", rate: "Infinity" }] }))).toContain("INVALID_NUMBER");
    expect(await codes("configuration.json", template["configuration.json"].replace('"company":', '"company": {}, "company":'))).toContain("MALFORMED_JSON");
  });
});
describe("strict parsers", () => {
  it("parses quoted commas, CRLF, multiline and escaped quotes", () => {
    expect(csvRows('id,name\r\na1,"one, two\nthree"\r\n')).toEqual([["id", "name"], ["a1", "one, two\nthree"]]);
    expect(csvRows('id,name\na1,"say ""hi"""')).toEqual([["id", "name"], ["a1", 'say "hi"']]);
  });
  it.each(['{"a":1,"a":2}', '{"a":NaN}', '{"a":1e999}', '{"a":"\\u202e"}', '{"a":"\\u0000"}', '{"a":1,}', '[1,]', '['.repeat(18) + ']'.repeat(18)])('rejects JSON hazard %s', text => { expect(() => strictJson(text)).toThrow(); });
  it("keeps prototype-looking keys inert", () => { expect(Object.getPrototypeOf(strictJson('{"__proto__":{"x":1}}'))).toBeNull(); });
});
describe("bounded flat ZIP", () => {
  it("round-trips the synthetic template and verifies CRC32", async () => {
    expect(crc32(encode("123456789"))).toBe(0xcbf43926);
    const zip = storedZip(files()); expect((await readFlatZip(zip)).map(f => [f.name, Array.from(f.bytes)])).toEqual(files().map(f => [f.name, Array.from(f.bytes)]));
    expect((await validateBrowserPackage([{ name: "template.zip", bytes: zip }])).status).toBe("READY");
  });
  it("supports deflate via the native bounded stream", async () => {
    const source = { name: "customers.csv", bytes: encode("id,display_name\nc1,Name\n") }, stored = storedZip([source]), packed = deflateRawSync(source.bytes);
    const localSize = 30 + source.name.length, centralSize = 46 + source.name.length;
    const zip = new Uint8Array(localSize + packed.length + centralSize + 22);
    zip.set(stored.subarray(0, localSize)); zip.set(packed, localSize); zip.set(stored.subarray(localSize + source.bytes.length), localSize + packed.length);
    const view = new DataView(zip.buffer), central = localSize + packed.length;
    view.setUint16(8, 8, true); view.setUint32(18, packed.length, true); view.setUint16(central + 10, 8, true); view.setUint32(central + 20, packed.length, true); view.setUint32(zip.length - 6, central, true);
    expect((await readFlatZip(zip)).map(f => [f.name, Array.from(f.bytes)])).toEqual([[source.name, Array.from(source.bytes)]]);
  });
  it.each(["../customers.csv", "nested/customers.csv", "Customers.csv", "payload.zip"])("rejects unsafe name %s", async name => { await expect(readFlatZip(storedZip([{ name, bytes: encode("x") }]))).rejects.toThrow(); });
  it("rejects corruption, duplicate names, excessive count and forged size", async () => {
    const zip = storedZip(files()); zip[40] ^= 1; await expect(readFlatZip(zip)).rejects.toThrow();
    await expect(readFlatZip(storedZip([files()[0], files()[0]]))).rejects.toThrow();
    await expect(readFlatZip(storedZip(Array.from({ length: 10 }, () => files()[0])))).rejects.toThrow();
    const bomb = storedZip([files()[0]]), view = new DataView(bomb.buffer), central = view.getUint32(bomb.length - 6, true);
    view.setUint32(central + 24, 262145, true); await expect(readFlatZip(bomb)).rejects.toThrow();
  });
  it.each([1, 8, 64, 0x2000])("rejects unsafe flags %s", async flag => {
    const zip = storedZip([files()[0]]), view = new DataView(zip.buffer), central = view.getUint32(zip.length - 6, true);
    view.setUint16(6, flag, true); view.setUint16(central + 8, flag, true); await expect(readFlatZip(zip)).rejects.toThrow();
  });
  it.each(["ratio", "symlink", "multidisk", "extra", "comment", "crc", "truncated"])("rejects archive hazard %s", async hazard => {
    let zip = storedZip([files()[0]]);
    const view = new DataView(zip.buffer), central = view.getUint32(zip.length - 6, true);
    if (hazard === "ratio") view.setUint32(central + 24, 262144, true);
    if (hazard === "symlink") view.setUint32(central + 38, 0xa0000000, true);
    if (hazard === "multidisk") view.setUint16(zip.length - 18, 1, true);
    if (hazard === "extra") view.setUint16(central + 30, 1, true);
    if (hazard === "comment") view.setUint16(zip.length - 2, 1, true);
    if (hazard === "crc") { view.setUint32(14, 0, true); view.setUint32(central + 16, 0, true); }
    if (hazard === "truncated") zip = zip.slice(0, -1);
    await expect(readFlatZip(zip)).rejects.toThrow();
  });

});
