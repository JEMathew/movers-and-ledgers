import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/try-your-data", "/workspace", "/approvals", "/reports", "/assess"];

/**
 * Pages Next.js prerenders as static HTML. For these it sends `Cache-Control: s-maxage=31536000`, which lets the
 * Firebase Hosting CDN keep the HTML for up to a year. After a new web revision, cached HTML can then point at CSS and
 * JavaScript files the new revision no longer serves (the stale-asset failure seen before). Short shared caching keeps
 * the CDN benefit while bounding that window to a minute; a Hosting release after promotion clears it at once.
 * Dynamic pages keep Next's own `private, no-store`. Hashed `/_next/static` files stay immutable (not matched here).
 * Keep this list equal to the `○ (Static)` routes in `next build` output (test/html-cache.test.ts checks it).
 */
export const STATIC_HTML_ROUTES = [
  "/", "/assess", "/design-system", "/feedback", "/guide", "/learn", "/migrate-resolve", "/onboard-fpu",
  "/plan-map-approve", "/play", "/privacy", "/terms", "/simulator", "/support", "/try-your-data", "/validate-configure",
] as const;
export const STATIC_HTML_CACHE = "public, max-age=0, s-maxage=60, must-revalidate";

function withHtmlCache(request: NextRequest, response: NextResponse) {
  if ((STATIC_HTML_ROUTES as readonly string[]).includes(request.nextUrl.pathname)) response.headers.set("Cache-Control", STATIC_HTML_CACHE);
  return response;
}

export function middleware(request: NextRequest) {
  // Cloud routes contain only a shell. Every data request verifies the Firebase token
  // at the backend. A demo cookie is never a cloud authorization credential.
  if (process.env.NEXT_PUBLIC_IDENTITY_MODE === "firebase") return withHtmlCache(request, NextResponse.next());
  if (!protectedPrefixes.some((path) => request.nextUrl.pathname.startsWith(path))) return withHtmlCache(request, NextResponse.next());
  if (request.cookies.get("mb_session")?.value) return withHtmlCache(request, NextResponse.next());
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(signIn);
}

// The protected prefixes keep their sub-paths exactly as before; the static pages are matched by exact path only.
export const config = {
  matcher: [
    "/try-your-data/:path*", "/workspace/:path*", "/approvals/:path*", "/reports/:path*", "/assess/:path*",
    "/", "/design-system", "/feedback", "/guide", "/learn", "/migrate-resolve", "/onboard-fpu",
    "/plan-map-approve", "/play", "/privacy", "/terms", "/simulator", "/support", "/validate-configure",
  ],
};
