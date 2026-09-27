import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/try-your-data", "/workspace", "/approvals", "/reports", "/assess"];

export function middleware(request: NextRequest) {
  // Cloud routes contain only a shell. Every data request verifies the Firebase token
  // at the backend. A demo cookie is never a cloud authorization credential.
  if (process.env.NEXT_PUBLIC_IDENTITY_MODE === "firebase") return NextResponse.next();
  if (!protectedPrefixes.some((path) => request.nextUrl.pathname.startsWith(path))) return NextResponse.next();
  if (request.cookies.get("mb_session")?.value) return NextResponse.next();
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(signIn);
}

export const config = { matcher: ["/try-your-data/:path*", "/workspace/:path*", "/approvals/:path*", "/reports/:path*", "/assess/:path*"] };
