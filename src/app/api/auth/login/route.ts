import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const usernameRaw = body?.username;
  const password = body?.password;

  if (!usernameRaw || !password) {
    return NextResponse.json(
      { error: "Username dan password harus diisi" },
      { status: 400 }
    );
  }

  // Normalisasi username (hilangkan spasi di ujung)
  const username = String(usernameRaw).trim();

  // Cari email dari username (case-insensitive)
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .ilike("username", username) // ILIKE untuk pencarian case-insensitive
    .limit(1);

  if (profileError || !profiles || profiles.length === 0) {
    return NextResponse.json(
      { error: "Username tidak ditemukan" },
      { status: 404 }
    );
  }

  const profile = profiles[0];

  // Login supabase
  const { data, error: loginError } =
    await supabaseAdmin.auth.signInWithPassword({
      email: profile.email,
      password,
    });

  if (loginError) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  // Set cookie & response
  const response = NextResponse.json({
    message: "Login success",
    user: data.user,
    session: data.session,
  });

  if (data.session) {
    response.cookies.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("sb-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
