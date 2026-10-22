import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
vi.mock("server-only", () => ({}));
vi.mock("./reviewed-media.json", () => ({ default: Object.fromEntries(["04", "05", "09"].map(id => [id, "84d89877f0d4041efb6bf91a16f0248f2fd573e6af05c19f96bedb9f882f7882"])) }));
import { academyMedia, academyFile } from "./media";
import { GET } from "@/app/api/academy-media/[id]/[extension]/route";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "academy-test-"));
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("MOVEBOOKS_ACADEMY_MEDIA_DIR", root);
  await writeFile(path.join(root, "manifest.json"), JSON.stringify(Object.fromEntries(["01", "02", "03", "04", "05", "06", "07", "08", "09"].map(id => [id, { previewApproved: true, technicalChecksPassed: true, captionsVerified: true, durationSeconds: 88 }]))));
  for (const id of ["01", "02", "03", "04", "05", "06", "07", "08", "09"]) for (const ext of ["mp4", "vtt", "jpg", "txt"]) await writeFile(path.join(root, `${id}.${ext}`), ["04", "05", "09"].includes(id) && ext === "mp4" ? "original-review-cut" : "0123456789");
});
afterEach(async () => { vi.unstubAllEnvs(); await rm(root, { recursive: true, force: true }); });
function request(id: string, extension = "mp4", range?: string) { return GET(new Request("http://localhost/api/academy-media", { headers: range ? { range } : {} }), { params: Promise.resolve({ id, extension }) }); }
describe("Media publication boundary (synthetic bytes, not playback QA)", () => {
  it("permits explicitly flagged local review without inventing captions, never in production", async () => {
    await writeFile(path.join(root, "manifest.json"), JSON.stringify(Object.fromEntries(["01", "04", "05", "09"].map(id => [id, { reviewPreviewAllowed: true, technicalChecksPassed: true, durationSeconds: 88 }]))));
    expect(await academyMedia()).toEqual({});
    vi.stubEnv("MOVEBOOKS_ACADEMY_REVIEW_PREVIEW", "1");
    expect(Object.keys(await academyMedia())).toEqual(["01"]);
    expect((await academyMedia())["01"]?.captions).toBeUndefined();
    expect((await request("01", "vtt")).status).toBe(404);
    expect((await academyMedia())["01"]?.reviewOnly).toBe(true);
    for (const id of ["04", "05", "09"]) expect((await request(id)).status).toBe(404);
    vi.stubEnv("NODE_ENV", "production"); expect(await academyMedia()).toEqual({});
  });
  it("exposes only six completed local preview paths", async () => {
    expect(Object.keys(await academyMedia())).toEqual(["01", "02", "03", "06", "07", "08"]);
    for (const id of ["01", "02", "03", "06", "07", "08"]) { const r = await request(id); expect(r.status).toBe(200); expect(await r.text()).toBe("0123456789"); }
    for (const id of ["04", "05", "09", "../01"]) expect((await request(id)).status).toBe(404);
  });
  it("admits only exact corrected binaries, and rejects replacement even with all publication flags", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const ids = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];
    await writeFile(path.join(root, "manifest.json"), JSON.stringify(Object.fromEntries(ids.map(id => [id, { publicationApproved: true, technicalChecksPassed: true, captionsVerified: true, durationSeconds: 88 }]))));
    for (const id of ["04", "05", "09"]) {
      expect((await request(id)).status).toBe(404);
      await writeFile(path.join(root, `${id}.mp4`), "0123456789");
      for (const ext of ["mp4", "jpg", "vtt", "txt"]) expect((await request(id, ext)).status).toBe(200);
    }
    expect(Object.keys(await academyMedia())).toEqual(ids);
    await writeFile(path.join(root, "04.mp4"), "different-unreviewed-cut");
    expect((await request("04")).status).toBe(404);
  });
  it("fails closed in production and with unapproved or missing assets", async () => {
    vi.stubEnv("NODE_ENV", "production"); expect(await academyMedia()).toEqual({}); expect((await request("01")).status).toBe(404);
    vi.stubEnv("NODE_ENV", "development"); await writeFile(path.join(root, "manifest.json"), '{"01":{"previewApproved":false}}'); expect(await academyMedia()).toEqual({});
  });
  it("serves approved production bundles through the same paths, while ignoring review overrides", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MOVEBOOKS_ACADEMY_REVIEW_PREVIEW", "1");
    await writeFile(path.join(root, "manifest.json"), JSON.stringify(Object.fromEntries(["01", "02", "03", "04", "05", "06", "07", "08", "09"].map(id => [id, { publicationApproved: true, reviewPreviewAllowed: true, technicalChecksPassed: true, captionsVerified: true, durationSeconds: 88 }]))));
    const manifest = await academyMedia();
    expect(Object.keys(manifest)).toEqual(["01", "02", "03", "06", "07", "08"]);
    for (const id of ["01", "02", "03", "06", "07", "08"]) {
      expect(manifest[id as keyof typeof manifest]?.reviewOnly).toBe(false);
      for (const ext of ["mp4", "jpg", "vtt", "txt"]) {
        const r = await request(id, ext, "bytes=2-5");
        expect(r.status).toBe(206); expect(await r.text()).toBe("2345");
      }
    }
    for (const id of ["04", "05", "09"]) for (const ext of ["mp4", "jpg", "vtt", "txt"]) expect((await request(id, ext)).status).toBe(404);
    await rm(path.join(root, "03.txt"));
    expect((await request("03")).status).toBe(404);
    await rm(path.join(root, "01.vtt"));
    expect((await request("01")).status).toBe(404);
    await writeFile(path.join(root, "manifest.json"), JSON.stringify({ "02": { publicationApproved: true, reviewPreviewAllowed: true, technicalChecksPassed: true, captionsVerified: false, durationSeconds: 88 } }));
    expect(await academyMedia()).toEqual({});
  });
  it("serves bounded seek ranges, correct MIME types, and rejects invalid ranges", async () => {
    const r = await request("01", "mp4", "bytes=2-5"); expect(r.status).toBe(206); expect(r.headers.get("content-range")).toBe("bytes 2-5/10"); expect(await r.text()).toBe("2345");
    const suffix = await request("01", "mp4", "bytes=-3"); expect(await suffix.text()).toBe("789");
    for (const range of ["bytes=10-", "bytes=5-2", "bytes=-0", "bytes=0-1,4-5"]) expect((await request("01", "mp4", range)).status).toBe(416);
    const transcript = await request("01", "txt"); expect(transcript.headers.get("content-type")).toContain("text/plain"); await transcript.text();
    const captions = await request("01", "vtt"); expect(captions.headers.get("content-type")).toContain("text/vtt"); await captions.text();
  });
  it("rejects symlink escape and unknown file extensions", async () => {
    await rm(path.join(root, "01.mp4")); await symlink(path.join(root, "..", "outside.mp4"), path.join(root, "01.mp4"));
    expect(await academyFile("01", "mp4")).toBeUndefined(); expect(await academyFile("02", "json")).toBeUndefined();
  });
});
