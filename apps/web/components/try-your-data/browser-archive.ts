/** Browser-only bounded ZIP reader. No network, filesystem extraction or external parser. */
import contract from "./package-contract.json";
export type PackageFile = { name: string; bytes: Uint8Array };
const names = new Set([...contract.files.map(f => f.name), "configuration.json", "metadata.json"]);
const { max_files: MAX_FILES, max_file_bytes: MAX_FILE, max_total_bytes: MAX_TOTAL } = contract.limits;
const fail = () => { throw new Error("Use one flat ZIP with supported filenames, stored or deflated entries, no encryption or folders, and within the package limits. Re-export if the archive is malformed."); };
export function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
async function inflate(bytes: Uint8Array, expected: number) {
  // Stream expansion is capped independently of the archive's untrusted size metadata.
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const parts: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > expected || size > MAX_FILE) { await reader.cancel(); fail(); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  if (size !== expected) fail();
  const result = new Uint8Array(size); let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}
export async function readFlatZip(bytes: Uint8Array): Promise<PackageFile[]> {
  try {
    if (bytes.length > MAX_TOTAL || bytes.length < 22) fail();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const u16 = (n: number) => view.getUint16(n, true), u32 = (n: number) => view.getUint32(n, true);
    // Deliberately reject comments, multi-disk, ZIP64 and data descriptors: narrow supported ZIP.
    const end = bytes.length - 22;
    if (u32(end) !== 0x06054b50 || u16(end + 4) || u16(end + 6) || u16(end + 20)) fail();
    const count = u16(end + 10), start = u32(end + 16), directorySize = u32(end + 12);
    if (!count || count > MAX_FILES || count !== u16(end + 8) || start + directorySize !== end) fail();
    const result: PackageFile[] = [], seen = new Set<string>(); let cursor = start, expanded = 0, localEnd = 0;
    for (let i = 0; i < count; i++) {
      if (u32(cursor) !== 0x02014b50 || cursor + 46 > end) fail();
      const flags = u16(cursor + 8), method = u16(cursor + 10), crc = u32(cursor + 16), packed = u32(cursor + 20), size = u32(cursor + 24);
      const nameLength = u16(cursor + 28), extraLength = u16(cursor + 30), commentLength = u16(cursor + 32), local = u32(cursor + 42);
      const next = cursor + 46 + nameLength + extraLength + commentLength;
      if (next > end || flags & ~0x800 || ![0, 8].includes(method) || u16(cursor + 34) || ((u32(cursor + 38) >>> 16) & 0xf000) === 0xa000 || extraLength || commentLength) fail();
      const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
      const name = new TextDecoder("utf-8", { fatal: true }).decode(nameBytes);
      if (!names.has(name) || seen.has(name) || size > MAX_FILE || size > Math.max(packed, 1) * 100 || (expanded += size) > MAX_TOTAL) fail();
      seen.add(name);
      if (local !== localEnd || u32(local) !== 0x04034b50 || u16(local + 6) !== flags || u16(local + 8) !== method || u32(local + 14) !== crc || u32(local + 18) !== packed || u32(local + 22) !== size || u16(local + 26) !== nameLength || u16(local + 28)) fail();
      const dataStart = local + 30 + nameLength; localEnd = dataStart + packed;
      if (localEnd > start || !nameBytes.every((b, j) => bytes[local + 30 + j] === b)) fail();
      const compressed = bytes.slice(dataStart, localEnd);
      const content = method === 0 ? compressed : await inflate(compressed, size);
      if (content.length !== size || crc32(content) !== crc) fail();
      result.push({ name, bytes: content }); cursor = next;
    }
    if (cursor !== end || localEnd !== start) fail();
    return result;
  } catch { return fail(); }
}
/** Deterministic stored ZIP for the bundled synthetic template. */
export function storedZip(files: PackageFile[]) {
  const encoded = files.map(f => ({ ...f, nameBytes: new TextEncoder().encode(f.name), crc: crc32(f.bytes) }));
  const localSize = encoded.reduce((n, f) => n + 30 + f.nameBytes.length + f.bytes.length, 0);
  const directorySize = encoded.reduce((n, f) => n + 46 + f.nameBytes.length, 0);
  const bytes = new Uint8Array(localSize + directorySize + 22), view = new DataView(bytes.buffer);
  const put16 = (p: number, n: number) => view.setUint16(p, n, true), put32 = (p: number, n: number) => view.setUint32(p, n, true);
  let cursor = 0, central = localSize;
  for (const f of encoded) {
    put32(cursor, 0x04034b50); put16(cursor + 4, 20); put32(cursor + 14, f.crc); put32(cursor + 18, f.bytes.length); put32(cursor + 22, f.bytes.length); put16(cursor + 26, f.nameBytes.length);
    bytes.set(f.nameBytes, cursor + 30); bytes.set(f.bytes, cursor + 30 + f.nameBytes.length);
    put32(central, 0x02014b50); put16(central + 4, 20); put16(central + 6, 20); put32(central + 16, f.crc); put32(central + 20, f.bytes.length); put32(central + 24, f.bytes.length); put16(central + 28, f.nameBytes.length); put32(central + 42, cursor); bytes.set(f.nameBytes, central + 46);
    cursor += 30 + f.nameBytes.length + f.bytes.length; central += 46 + f.nameBytes.length;
  }
  put32(central, 0x06054b50); put16(central + 8, files.length); put16(central + 10, files.length); put32(central + 12, directorySize); put32(central + 16, localSize);
  return bytes;
}
