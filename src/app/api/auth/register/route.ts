import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { username, password, email, role, kas, initial_balance } =
    await req.json();

  // Create user on Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email || `${username}@app.local`,
    password,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "User not created" }, { status: 500 });
  }

  // Insert profile using supabaseAdmin → bypass RLS
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    username,
    email: email || `${username}@app.local`,
    role: role || "user",
    kas: kas || 0,
    initial_balance: initial_balance || 0,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ message: "User registered successfully" });
}
