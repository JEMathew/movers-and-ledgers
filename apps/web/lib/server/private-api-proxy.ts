import { allowedRoute, cloudIntake } from "./proxy-policy";

export type ProxyConfig = { upstream: string; publicOrigin: string; projectId: string; additionalOrigins?: string[] };
export type ProxyDependencies = {
  verifyUser: (token: string, projectId: string) => Promise<void>;
  workloadAuthorization: (audience: string) => Promise<string>;
  fetch: typeof fetch;
};

const REQUEST_LIMIT = 256 * 1024;
const RESPONSE_LIMIT = 8 * 1024 * 1024;
const responseHeaders = { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" };
const failure = (status: number, detail: string) => Response.json({ detail }, { status, headers: responseHeaders });

export function proxyConfig(env: Partial<NodeJS.ProcessEnv>): ProxyConfig {
  const upstream = new URL(env.MOVEBOOKS_PRIVATE_API_ORIGIN ?? "invalid");
  const publicOrigin = new URL(env.MOVEBOOKS_PUBLIC_WEB_ORIGIN ?? "invalid");
  // Deployment-owned origins only; never derive the upstream/audience from client headers.
  if (upstream.protocol !== "https:" || !upstream.hostname.endsWith(".run.app") ||
      upstream.origin === publicOrigin.origin || upstream.href !== `${upstream.origin}/` ||
      publicOrigin.protocol !== "https:" || publicOrigin.href !== `${publicOrigin.origin}/` ||
      env.NEXT_PUBLIC_IDENTITY_MODE !== "firebase" || !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error("Private API proxy is not configured");
  }
  const additionalOrigins = env.MOVEBOOKS_ADDITIONAL_WEB_ORIGINS?.split(",").map(value => {
    const origin = new URL(value.trim());
    if (origin.protocol !== "https:" || origin.href !== `${origin.origin}/` ||
        origin.hostname.includes("*") || origin.origin === upstream.origin) {
      throw new Error("Invalid additional web origin");
    }
    return origin.origin;
  });
  return { upstream: upstream.origin, publicOrigin: publicOrigin.origin, projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ...(additionalOrigins ? { additionalOrigins } : {}),
  };
}

async function boundedBody(stream: ReadableStream<Uint8Array> | null, limit: number) {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new Error("Body limit"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

/** Transport only: no owner claims, approval logic, retries, or state transformations. */
export async function proxyRequest(request: Request, config: ProxyConfig, dependencies: ProxyDependencies) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "");
  if (!url.pathname.startsWith("/api/v1/") || url.search ||
      (!allowedRoute(request.method, path) && !cloudIntake(path))) return failure(404, "API route unavailable.");
  const origin = request.headers.get("origin");
  const allowedOrigins = [config.publicOrigin, ...(config.additionalOrigins ?? [])];
  if ((origin && !allowedOrigins.includes(origin)) ||
      (request.method !== "GET" && (!origin || !allowedOrigins.includes(origin))) ||
      request.headers.get("sec-fetch-site") === "cross-site") return failure(403, "Same-origin request required.");
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization) || authorization.length > 8192) {
    return failure(401, "Sign in with Google to access this workspace.");
  }
  try { await dependencies.verifyUser(authorization.slice(7), config.projectId); }
  catch { return failure(401, "Sign in with Google to access this workspace."); }
  // Do not read, forward, log or persist uploaded data in the public Beta.
  if (cloudIntake(path)) return failure(503, "Controlled exports remain local-only; cloud retention is not enabled.");
  let body: Uint8Array | undefined;
  if (request.method === "POST" && request.body) {
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return failure(415, "JSON requests only.");
    }
    try { body = await boundedBody(request.body, REQUEST_LIMIT); }
    catch { return failure(413, "Synthetic request exceeds the bounded Beta limit."); }
  }
  const headers = new Headers({ Authorization: authorization, Accept: "application/json" });
  if (body) headers.set("Content-Type", "application/json");
  const key = request.headers.get("idempotency-key");
  if (key) {
    if (!/^[A-Za-z0-9._:-]{1,200}$/.test(key)) return failure(400, "Invalid idempotency key.");
    headers.set("Idempotency-Key", key);
  }
  try {
    // Cloud Run IAM uses this header; Firebase continues to use Authorization in the API.
    headers.set("X-Serverless-Authorization", await dependencies.workloadAuthorization(config.upstream));
    const upstream = await dependencies.fetch(`${config.upstream}${path}`, {
      method: request.method, headers, body: body ? Buffer.from(body) : undefined,
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(60_000),
    });
    if (upstream.status >= 500) return failure(503, "Workspace service temporarily unavailable. Retry safely; no approval is implied.");
    const template = path === "/v1/intake/template" && upstream.status === 200;
    const contentType = template ? "application/zip" : "application/json";
    if (!upstream.headers.get("content-type")?.startsWith(contentType)) return failure(502, "Workspace service returned an invalid response.");
    const data = await boundedBody(upstream.body, RESPONSE_LIMIT);
    // No upstream cookies, redirects, CORS headers or authentication headers leave the proxy.
    return new Response(Buffer.from(data), { status: upstream.status, headers: {
      ...responseHeaders, "Content-Type": contentType,
      ...(template ? { "Content-Disposition": 'attachment; filename="controlled-package.zip"' } : {}),
    } });
  } catch {
    // Never log headers, tokens, request bodies or provider exception strings.
    return failure(503, "Workspace service temporarily unavailable. Retry safely; no approval is implied.");
  }
}
