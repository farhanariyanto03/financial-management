import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Cari email berdasarkan username
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("username", username)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Username tidak ditemukan" },
      { status: 404 }
    );
  }

  // Login pakai email
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (loginError) {
    return NextResponse.json({ error: loginError.message }, { status: 401 });
  }

  return NextResponse.json({
    message: "Login success",
    user: data.user,
  });
}
