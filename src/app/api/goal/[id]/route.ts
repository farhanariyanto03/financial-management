import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get goal
    const { data: goal, error: goalError } = await supabaseAdmin
      .from("goals")
      .select("*")
      .eq("id", id)
      .single();

    if (goalError) {
      return NextResponse.json({ error: goalError.message }, { status: 404 });
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
      .eq("goal_id", id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ goal: { ...goal, items } });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { destination, start_date, end_date, total_budget, goal_items } =
      body;

    // Update goal
    const { error: goalError } = await supabaseAdmin
      .from("goals")
      .update({
        destination,
        start_date,
        end_date,
        total_budget,
      })
      .eq("id", id);

    if (goalError) {
      return NextResponse.json({ error: goalError.message }, { status: 500 });
    }

    // Delete existing items
    await supabaseAdmin.from("goal_items").delete().eq("goal_id", id);

    // Insert new items
    if (goal_items && goal_items.length > 0) {
      const { data: categories } = await supabaseAdmin
        .from("goal_item_categories")
        .select("id, name");

      const categoryMap = categories?.reduce((acc: any, cat: any) => {
        acc[cat.name] = cat.id;
        return acc;
      }, {});

      const itemsToInsert = goal_items.map((item: any) => ({
        goal_id: id,
        category_id: categoryMap[item.category_name],
        item_name: item.item_name,
        cost_idr: item.cost_idr,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("goal_items")
        .insert(itemsToInsert);

      if (itemsError) {
        return NextResponse.json(
          { error: itemsError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
