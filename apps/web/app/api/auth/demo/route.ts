import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", {status: 404});
  const destination = request.nextUrl.searchParams.get("next") || "/workspace";
  const response = NextResponse.redirect(new URL(destination.startsWith("/") ? destination : "/workspace", request.url));
  response.cookies.set("mb_session", "synthetic-demo", {httpOnly: true, sameSite: "lax", secure: false, path: "/", maxAge: 3600});
  return response;
}

