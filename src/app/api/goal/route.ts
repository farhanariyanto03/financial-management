import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

type GoalItemInput = {
  category_name: string;
  item_name: string;
  cost_idr: number;
};

type CreateGoalRequest = {
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  goal_items: GoalItemInput[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the latest goal for user
    const { data: goal, error: goalError } = await supabaseAdmin
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (goalError && goalError.code !== "PGRST116") {
      return NextResponse.json({ error: goalError.message }, { status: 500 });
    }

    if (!goal) {
      return NextResponse.json({ goal: null });
    }

    // Get goal items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("goal_items")
      .select(
        `
        *,
        goal_item_categories(name)
      `
      )
      .eq("goal_id", goal.id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Use current_amount directly from goals table
    const currentAmount = goal.current_amount || 0;

    return NextResponse.json({
      goal: { ...goal, items, current_amount: currentAmount },
    });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const {
    user_id,
    destination,
    start_date,
    end_date,
    total_budget,
    goal_items,
  }: CreateGoalRequest = await req.json();

  // Validate required fields
  if (!user_id || !destination || !start_date || !end_date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Insert goal
  const { data: goalData, error: goalError } = await supabaseAdmin
    .from("goals")
    .insert({
      user_id,
      destination,
      start_date,
      end_date,
      total_budget: total_budget || 0,
    })
    .select()
    .single();

  if (goalError) {
    return NextResponse.json({ error: goalError.message }, { status: 500 });
  }

  // Ambil semua kategori unik
  const categoryNames = [
    ...new Set(goal_items.map((item) => item.category_name)),
  ];

  const { data: categories, error: categoryError } = await supabaseAdmin
    .from("goal_item_categories")
    .select("id, name")
    .in("name", categoryNames);

  if (categoryError) {
    return NextResponse.json({ error: categoryError.message }, { status: 400 });
  }

  const categoryMap = new Map<string, number>(
    (categories ?? []).map((cat) => [cat.name, cat.id])
  );

  // Siapkan goal_items untuk insert
  const goalItemsToInsert = goal_items.map((item) => ({
    goal_id: goalData.id,
    category_id: categoryMap.get(item.category_name),
    item_name: item.item_name,
    cost_idr: item.cost_idr,
  }));

  const { error: itemsError } = await supabaseAdmin
    .from("goal_items")
    .insert(goalItemsToInsert);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      success: true,
      goal_id: goalData.id,
    },
    { status: 201 }
  );
}
