import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  // Jika user sudah login, redirect dari halaman auth ke dashboard
  if (
    (accessToken || refreshToken) &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  // Jika user belum login, redirect ke login
  if (
    !accessToken &&
    !refreshToken &&
    request.nextUrl.pathname.startsWith("/user")
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/user/:path*"],
};
