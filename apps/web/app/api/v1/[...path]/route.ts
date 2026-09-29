import { proxyConfig, proxyRequest } from "@/lib/server/private-api-proxy";
import { verifyUser, workloadAuthorization } from "@/lib/server/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  let config;
  try { config = proxyConfig(process.env); }
  catch { return Response.json({ detail: "Private API proxy unavailable. No demo fallback was used." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  return proxyRequest(request, config, { verifyUser, workloadAuthorization, fetch });
}

export { handle as GET, handle as POST };
