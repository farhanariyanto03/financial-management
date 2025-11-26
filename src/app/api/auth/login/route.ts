import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Cari email dari username
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("username", username)
    .single();

  if (!profile || profileError) {
    return NextResponse.json(
      { error: "Username tidak ditemukan" },
      { status: 404 }
    );
  }

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
