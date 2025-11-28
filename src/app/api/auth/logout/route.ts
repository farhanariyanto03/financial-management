import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const accessToken = request.headers
    .get("Authorization")
    ?.replace("Bearer ", "");

  // Kalau client tidak mengirim token, ambil dari cookies
  const cookieAccessToken = request.headers
    .get("Cookie")
    ?.match(/sb-access-token=([^;]+)/)?.[1];

  const token = accessToken || cookieAccessToken;

  if (token) {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
    });
  }

  const response = NextResponse.json({
    message: "Logout success",
  });

  // Hapus cookies
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");

  return response;
}
