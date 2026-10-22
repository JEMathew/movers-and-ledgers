import { open, stat } from "node:fs/promises";
import { academyMedia, previewFile } from "@/lib/academy/media";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Local development only. Review cuts cannot be fetched even by guessing a URL.
export async function GET(request: Request, context: { params: Promise<{ id: string; extension: string }> }) {
  const { id, extension } = await context.params;
  const manifest = await academyMedia();
  if (!Object.hasOwn(manifest, id)) return new Response(null, { status: 404 });
  const filename = await previewFile(id, extension);
  if (!filename) return new Response(null, { status: 404 });
  try {
    const { size } = await stat(filename);
    let start = 0, end = size - 1;
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      if (!match[1]) start = Math.max(0, size - Number(match[2]));
      else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1; }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const handle = await open(filename, "r");
    let cursor = start;
    let closed = false;
    async function close() { if (!closed) { closed = true; await handle.close(); } }
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const buffer = new Uint8Array(Math.min(64 * 1024, end - cursor + 1));
          const { bytesRead } = await handle.read(buffer, 0, buffer.length, cursor);
          if (!bytesRead) { controller.close(); await close(); return; }
          cursor += bytesRead; controller.enqueue(buffer.subarray(0, bytesRead));
          if (cursor > end) { controller.close(); await close(); }
        } catch (error) { controller.error(error); await close(); }
      },
      cancel: close,
    });
    return new Response(body, { status: range ? 206 : 200, headers: {
      "Content-Type": extension === "mp4" ? "video/mp4" : extension === "vtt" ? "text/vtt; charset=utf-8" : "image/webp",
      "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
    } });
  } catch { return new Response(null, { status: 404 }); }
}
