import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

type AddSavingsRequest = {
  goal_id: string;
  amount: number;
};

export async function POST(req: Request) {
  try {
    const { goal_id, amount }: AddSavingsRequest = await req.json();

    // Validate input
    if (!goal_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid goal_id or amount" },
        { status: 400 }
      );
    }

    // Insert into goal_savings
    const { error: savingsError } = await supabaseAdmin
      .from("goal_savings")
      .insert({
        goal_id,
        amount,
      });

    if (savingsError) {
      return NextResponse.json(
        { error: savingsError.message },
        { status: 500 }
      );
    }

    // Get current total savings
    const { data: savings, error: fetchError } = await supabaseAdmin
      .from("goal_savings")
      .select("amount")
      .eq("goal_id", goal_id);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const totalSavings =
      savings?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;

    // Update current_amount in goals table
    const { error: updateError } = await supabaseAdmin
      .from("goals")
      .update({ current_amount: totalSavings })
      .eq("id", goal_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      totalSavings,
    });
  } catch (error) {
    console.error("Error adding savings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
