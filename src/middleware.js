import { NextResponse } from "next/server";
import { verifyAuthToken } from "./lib/jwt";

export const runtime = "nodejs";

export const config = {
  matcher: ["/dashboard/:path*"],
};

export function middleware(req) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const session = verifyAuthToken(token);

  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}