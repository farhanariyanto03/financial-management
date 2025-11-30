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

    // Get current user profile to check balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("initial_balance, kas")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Gunakan initial_balance sebagai saldo saat ini
    const currentBalance = Number(profile.initial_balance);

    // Validate balance for expenses
    if (type === "pengeluaran" && amount > currentBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Calculate new balance
    const newBalance =
      type === "pengeluaran"
        ? currentBalance - amount
        : currentBalance + amount;

    // Start transaction
    const transactionDateTime = date_transaction;

    // Insert transaction and update balance
    const { data: transactionData, error: transactionError } =
      await supabaseAdmin
        .from("transactions")
        .insert({
          user_id: user.id,
          type: type === "pemasukkan" ? "income" : "expense",
          amount,
          note: note || null,
          category_id,
          date_transaction: transactionDateTime,
        })
        .select()
        .single();

    if (transactionError) {
      console.error(transactionError);
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    // Update initial_balance instead of kas
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ initial_balance: newBalance })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update balance:", updateError);
      // Optionally rollback transaction here
      await supabaseAdmin
        .from("transactions")
        .delete()
        .eq("id", transactionData.id);

      return NextResponse.json(
        { error: "Failed to update balance" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: transactionData,
      newBalance: newBalance,
    });
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
    const userId = searchParams.get("user_id");

    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If requesting monthly data for cash flow chart
    if (type === "monthly") {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Get last 6 months data
      const monthlyData = [];
      const currentMonthStats = {
        currentIncome: 0,
        currentExpense: 0,
        previousIncome: 0,
        previousExpense: 0,
      };

      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const targetMonth = targetDate.getMonth() + 1;
        const targetYear = targetDate.getFullYear();

        const startDate = `${targetYear}-${targetMonth
          .toString()
          .padStart(2, "0")}-01`;
        const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1;
        const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear;
        const endDate = `${nextYear}-${nextMonth
          .toString()
          .padStart(2, "0")}-01`;

        const { data: monthTransactions } = await supabaseAdmin
          .from("transactions")
          .select("type, amount")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .gte("date_transaction", startDate)
          .lt("date_transaction", endDate);

        let monthIncome = 0;
        let monthExpense = 0;

        monthTransactions?.forEach((transaction: any) => {
          if (transaction.type === "income") {
            monthIncome += transaction.amount;
          } else {
            monthExpense += transaction.amount;
          }
        });

        const monthName = targetDate.toLocaleDateString("id-ID", {
          month: "short",
        });

        monthlyData.push({
          month: monthName,
          pemasukkan: monthIncome,
          pengeluaran: monthExpense,
        });

        // Store current and previous month stats
        if (i === 0) {
          // Current month
          currentMonthStats.currentIncome = monthIncome;
          currentMonthStats.currentExpense = monthExpense;
        } else if (i === 1) {
          // Previous month
          currentMonthStats.previousIncome = monthIncome;
          currentMonthStats.previousExpense = monthExpense;
        }
      }

      return NextResponse.json({
        monthlyData,
        currentMonthStats,
      });
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
      .order("date_transaction", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100); // Reasonable limit for performance

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
