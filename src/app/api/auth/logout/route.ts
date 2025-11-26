import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Logout success",
  });

  // Hapus cookies
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");

  return response;
}
