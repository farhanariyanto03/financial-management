import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register";

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/user");

  // User sudah login, jangan boleh ke login/register
  if ((accessToken || refreshToken) && isAuthPage) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  // Jika token tidak ada atau session sudah mati → redirect ke login
  if (!accessToken && !refreshToken && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/user/:path*"],
};
