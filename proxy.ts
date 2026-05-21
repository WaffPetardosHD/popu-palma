import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const getSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "popu-palma-secret-2024-change-in-prod"
  );

const PROTECTED = ["/vote", "/settings"];
const AUTH_ONLY = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("popu_session")?.value;

  let authenticated = false;
  if (token) {
    try {
      await jwtVerify(token, getSecret());
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_ONLY.includes(pathname) && authenticated) {
    return NextResponse.redirect(new URL("/vote", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/vote", "/settings", "/login", "/register"],
};
