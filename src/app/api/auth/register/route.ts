import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, email, password, name } = await req.json();

  // Cek username unik
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Username sudah digunakan" },
      { status: 400 }
    );
  }

  // Buat user di Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Insert profile ke table profiles
  const { error: insertError } = await supabaseAdmin.from("profiles").insert({
    id: authData.user?.id,
    username,
    email,
    name,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Register berhasil" });
}
