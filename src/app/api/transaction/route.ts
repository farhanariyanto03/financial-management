import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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

export async function POST(req: Request) {
  try {
    const { type, amount, note, category_id, date_transaction } =
      await req.json();

    if (!type || !amount || !category_id || !date_transaction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ambil user yang login
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: type === "pemasukkan" ? "income" : "expense",
        amount,
        note: note || null,
        category_id,
        date_transaction,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, transaction: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If requesting dashboard stats
    if (type === "dashboard") {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Calculate start and end dates for current month
      const startDate = `${currentYear}-${currentMonth
        .toString()
        .padStart(2, "0")}-01`;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const endDate = `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01`;

      console.log(
        `Fetching transactions for current month: ${startDate} to ${endDate}`
      );

      // Get category-wise breakdown for current month only
      const { data: categoryStats, error: statsError } = await supabaseAdmin
        .from("transactions")
        .select(
          `
          type,
          amount,
          date_transaction,
          categories (
            id,
            name
          )
        `
        )
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .gte("date_transaction", startDate)
        .lt("date_transaction", endDate);

      if (statsError) {
        console.error("Stats error:", statsError);
        return NextResponse.json(
          { error: "Failed to fetch category stats" },
          { status: 500 }
        );
      }

      console.log(
        `Found ${categoryStats?.length || 0} transactions for current month`
      );

      // Aggregate data by category and type
      const incomeByCategory: { [key: string]: number } = {};
      const expenseByCategory: { [key: string]: number } = {};

      categoryStats?.forEach((transaction: any) => {
        const categoryName = transaction.categories?.name || "Lainnya";
        const amount = transaction.amount;

        console.log(
          `Processing: ${transaction.type} - ${categoryName} - ${amount}`
        );

        if (transaction.type === "income") {
          incomeByCategory[categoryName] =
            (incomeByCategory[categoryName] || 0) + amount;
        } else {
          expenseByCategory[categoryName] =
            (expenseByCategory[categoryName] || 0) + amount;
        }
      });

      console.log("Income by category:", incomeByCategory);
      console.log("Expense by category:", expenseByCategory);

      return NextResponse.json({
        incomeByCategory,
        expenseByCategory,
        currentMonth: `${currentYear}-${currentMonth
          .toString()
          .padStart(2, "0")}`,
        totalTransactions: categoryStats?.length || 0,
      });
    }

    // Original GET logic for all transactions
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select(
        `
          id,
          type,
          amount,
          note,
          date_transaction,
          created_at,
          categories (
            id,
            name
          )
        `
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("date_transaction", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
