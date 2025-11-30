import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Ambil user login dari cookies (sb-access-token)
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return { user: null, error: "No access token found" };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { user: null, error: "Invalid session" };
  }

  return { user, error: null };
}

export async function GET() {
  // Ambil user yang sedang login
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ambil profile berdasarkan user.id
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, kas, initial_balance")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format response
  return NextResponse.json({
    id: profile.id,
    account_name: profile.kas || "Cash", // Use kas field as account name
    username: profile.username, // Keep username separate
    initial_balance: profile.initial_balance ?? 0,
    current_amount: profile.kas ? Number(profile.kas) : profile.initial_balance,
  });
}
