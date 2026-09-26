import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/simulator", "/try-your-data", "/workspace", "/approvals", "/reports", "/assess"];

export function middleware(request: NextRequest) {
  if (!protectedPrefixes.some((path) => request.nextUrl.pathname.startsWith(path))) return NextResponse.next();
  if (request.cookies.get("mb_session")?.value) return NextResponse.next();
  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export const config = { matcher: ["/simulator/:path*", "/try-your-data/:path*", "/workspace/:path*", "/approvals/:path*", "/reports/:path*", "/assess/:path*"] };
