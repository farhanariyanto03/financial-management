"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, ArrowDown, ChevronDown, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { getAuthUser } from "@/lib/utils";
import { showToastSuccess } from "@/components/ui/alertToast";

// Category color mapping
const categoryColors: { [key: string]: string } = {
  "Makanan & Minuman": "#E63946", // merah tegas
  Belanja: "#1D3557", // biru gelap kuat
  Rumah: "#2A9D8F", // hijau kebiruan pekat
  Kendaraan: "#F4A261", // oranye hangat
  Hiburan: "#E9C46A", // kuning keemasan
  Keuangan: "#6A4C93", // ungu gelap
  Komunikasi: "#118AB2", // biru terang
  Investasi: "#06D6A0", // hijau mint neon
  Pemasukkan: "#EF476F", // pink kemerahan tegas
  Lainnya: "#8D99AE", // abu-abu kebiruan netral
};

// Sample recent transactions
const recentTransactions = [
  {
    id: 1,
    type: "expense",
    category: "Makanan",
    amount: 50000,
    time: "2 jam yang lalu",
  },
  {
    id: 2,
    type: "income",
    category: "Gaji",
    amount: 5000000,
    time: "1 hari yang lalu",
  },
  {
    id: 3,
    type: "expense",
    category: "Transportasi",
    amount: 25000,
    time: "2 hari yang lalu",
  },
  {
    id: 4,
    type: "expense",
    category: "Hiburan",
    amount: 150000,
    time: "3 hari yang lalu",
  },
];

// Sample data for bar chart
const monthlyData = [
  { month: "Jan", pemasukkan: 5000000, pengeluaran: 3500000 },
  { month: "Feb", pemasukkan: 4800000, pengeluaran: 3200000 },
  { month: "Mar", pemasukkan: 5200000, pengeluaran: 3800000 },
  { month: "Apr", pemasukkan: 5500000, pengeluaran: 4000000 },
  { month: "May", pemasukkan: 5800000, pengeluaran: 4200000 },
  { month: "Jun", pemasukkan: 6000000, pengeluaran: 4500000 },
];

const chartConfig = {
  pemasukkan: {
    label: "Pemasukkan",
    color: "#22c55e",
  },
  pengeluaran: {
    label: "Pengeluaran",
    color: "#ef4444",
  },
};

export default function DashboardPage() {
  const [hasGoal, setHasGoal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddAmountModal, setShowAddAmountModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [realIncomeData, setRealIncomeData] = useState<
    Array<{ name: string; value: number; fill: string }>
  >([]);
  const [realExpenseData, setRealExpenseData] = useState<
    Array<{ name: string; value: number; fill: string }>
  >([]);
  const [realRecentTransactions, setRealRecentTransactions] = useState<
    Array<{
      id: string;
      type: string;
      amount: number;
      note: string | null;
      date_transaction: string;
      categories: {
        id: string;
        name: string;
      };
    }>
  >([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [allTransactions, setAllTransactions] = useState<
    Array<{
      id: string;
      type: string;
      amount: number;
      note: string | null;
      date_transaction: string;
      categories: {
        id: string;
        name: string;
      };
    }>
  >([]);
  const router = useRouter();

  const [goal, setGoal] = useState<{
    id: string;
    destination: string;
    current_amount: number;
    total_budget: number;
    start_date: string;
    end_date: string;
    minWeekly: number;
  } | null>(null);

  const [monthlyChartData, setMonthlyChartData] = useState<
    Array<{ month: string; pemasukkan: number; pengeluaran: number }>
  >([]);
  const [currentMonthStats, setCurrentMonthStats] = useState({
    currentIncome: 0,
    currentExpense: 0,
    previousIncome: 0,
    previousExpense: 0,
  });

  const progress = goal ? (goal.current_amount / goal.total_budget) * 100 : 0;
  const totalExpenseData = realExpenseData.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const totalIncomeData = realIncomeData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // small percentage changes to show in the pie headers (adjust as needed)
  const incomeChangePercent = 10; // positive => green
  const expenseChangePercent = -4; // negative => red

  // Calculate savings comparison (remaining money after expenses)
  const currentSavings =
    currentMonthStats.currentIncome - currentMonthStats.currentExpense;
  const previousSavings =
    currentMonthStats.previousIncome - currentMonthStats.previousExpense;
  const savingsChange = currentSavings - previousSavings;
  const isSavingMore = savingsChange > 0; // having more remaining money is good
  const savingsChangeFormatted =
    Math.abs(savingsChange).toLocaleString("id-ID");

  const handleAddSavings = async () => {
    if (!addAmount || !goal) return;

    try {
      const response = await fetch("/api/goal/savings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal_id: goal.id,
          amount: parseAmount(addAmount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Recalculate minWeekly dengan current_amount yang baru
        const targetDate = new Date(goal.end_date);
        const today = new Date();
        const daysRemaining = Math.ceil(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const weeksRemaining = Math.ceil(daysRemaining / 7);
        const remainingAmount = goal.total_budget - data.totalSavings;
        const newMinWeekly =
          weeksRemaining > 0 ? Math.ceil(remainingAmount / weeksRemaining) : 0;

        // Update local state dengan minWeekly yang baru
        setGoal((prev) =>
          prev
            ? {
                ...prev,
                current_amount: data.totalSavings,
                minWeekly: newMinWeekly,
              }
            : null
        );
        setAddAmount("");
        setShowAddAmountModal(false);
        showToastSuccess("Berhasil menambahkan tabungan");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error adding savings:", error);
      alert("Gagal menambahkan tabungan");
    }
  };

  // Logout function
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Sign out dari Supabase
      await supabase.auth.signOut();

      // Hapus cookies via API
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Redirect ke login
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Gagal logout");
      setIsLoggingOut(false);
    }
  };

  // Fetch goal data
  useEffect(() => {
    const fetchGoal = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/goal?user_id=${userId}`);
        const data = await response.json();

        if (data.goal) {
          const targetDate = new Date(data.goal.end_date);
          const today = new Date();
          const daysRemaining = Math.ceil(
            (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          const weeksRemaining = Math.ceil(daysRemaining / 7);

          // Calculate remaining amount and min weekly
          const remainingAmount =
            data.goal.total_budget - (data.goal.current_amount || 0);
          const minWeekly =
            weeksRemaining > 0
              ? Math.ceil(remainingAmount / weeksRemaining)
              : 0;

          setGoal({
            id: data.goal.id,
            destination: data.goal.destination,
            current_amount: data.goal.current_amount || 0,
            total_budget: data.goal.total_budget,
            start_date: data.goal.start_date,
            end_date: data.goal.end_date,
            minWeekly,
          });
          setHasGoal(true);
        } else {
          setHasGoal(false);
        }
      } catch (error) {
        console.error("Error fetching goal:", error);
      }
    };

    fetchGoal();
  }, [userId]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, error } = await getAuthUser();

        if (error || !user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch transaction data for charts
  useEffect(() => {
    const fetchTransactionStats = async () => {
      if (!userId) return;

      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        console.log(
          `Fetching data for: ${currentYear}-${currentMonth
            .toString()
            .padStart(2, "0")}`
        );

        const response = await fetch("/api/transaction?type=dashboard");
        const data = await response.json();

        if (response.ok) {
          // console.log("API Response for current month:", data);

          // Convert income data
          const incomeChartData = Object.entries(
            data.incomeByCategory || {}
          ).map(([category, amount], index) => {
            // Try exact match first, then fallback to index-based colors
            let color = categoryColors[category];
            if (!color) {
              // Generate colors based on index if category not found
              const colors = [
                "#0088FE",
                "#00C49F",
                "#FFBB28",
                "#FF8042",
                "#8884D8",
                "#82CA9D",
              ];
              color = colors[index % colors.length];
            }

            // console.log(
            //   `Income category: ${category}, amount: ${amount}, color: ${color}`
            // );

            return {
              name: category,
              value: amount as number,
              fill: color,
            };
          });

          // Convert expense data
          const expenseChartData = Object.entries(
            data.expenseByCategory || {}
          ).map(([category, amount], index) => {
            // Try exact match first, then fallback to index-based colors
            let color = categoryColors[category];
            if (!color) {
              // Generate colors based on index if category not found
              const colors = [
                "#E63946",
                "#1D3557",
                "#2A9D8F",
                "#F4A261",
                "#E9C46A",
                "#6A4C93",
              ];
              color = colors[index % colors.length];
            }

            // console.log(
            //   `Expense category: ${category}, amount: ${amount}, color: ${color}`
            // );

            return {
              name: category,
              value: amount as number,
              fill: color,
            };
          });

          setRealIncomeData(incomeChartData);
          setRealExpenseData(expenseChartData);

          console.log("Charts updated with current month data");
        } else {
          console.error("Failed to fetch transaction stats:", data.error);
        }
      } catch (error) {
        console.error("Error fetching transaction stats:", error);
      }
    };

    fetchTransactionStats();

    // Set up interval to refresh data when month changes
    const checkMonthChange = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Refresh data at the beginning of each month (1st day, 00:00)
      if (now.getDate() === 1 && currentHour === 0 && currentMinute === 0) {
        console.log("Month changed, refreshing chart data...");
        fetchTransactionStats();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkMonthChange);
  }, [userId]);

  // Fetch recent transactions data
  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!userId) return;

      try {
        const response = await fetch("/api/transaction");
        const data = await response.json();

        if (response.ok && data.transactions) {
          // Store all transactions
          setAllTransactions(data.transactions);
          // Get last 5 transactions for initial display
          const recentTxns = data.transactions.slice(0, 5);
          setRealRecentTransactions(recentTxns);
          console.log("Recent transactions loaded:", recentTxns);
        } else {
          console.error("Failed to fetch recent transactions:", data.error);
        }
      } catch (error) {
        console.error("Error fetching recent transactions:", error);
      }
    };

    fetchRecentTransactions();
  }, [userId]);

  // Get transactions to display based on show more state
  const transactionsToShow = showAllTransactions
    ? allTransactions
    : realRecentTransactions;

  // Group transactions by date
  const groupTransactionsByDate = (transactions: typeof allTransactions) => {
    const groups: { [key: string]: typeof transactions } = {};

    transactions.forEach((transaction) => {
      const dateKey = transaction.date_transaction;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const groupedTransactions = groupTransactionsByDate(transactionsToShow);

  // Format date for grouping
  const formatDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hari ini";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    } else {
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const transactionDate = new Date(dateString);

    // Check if the date is valid
    if (isNaN(transactionDate.getTime())) {
      return "Waktu tidak valid";
    }

    const diffInMilliseconds = now.getTime() - transactionDate.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return "Baru saja";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    } else if (diffInDays === 1) {
      return "1 hari yang lalu";
    } else if (diffInDays < 7) {
      return `${diffInDays} hari yang lalu`;
    } else {
      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks === 1) {
        return "1 minggu yang lalu";
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks} minggu yang lalu`;
      } else {
        return transactionDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // helper: format angka ke format ID (ribuan dengan titik)
  const formatRupiah = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
  };

  // helper: parse string berformat rupiah -> number (mis. "1.000.000" -> 1000000)
  const parseAmount = (value: string) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits ? Number(digits) : 0;
  };

  // Fetch monthly data for cash flow chart
  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `/api/transaction?type=monthly&user_id=${userId}`
        );
        const data = await response.json();

        if (response.ok) {
          setMonthlyChartData(data.monthlyData || []);
          setCurrentMonthStats(
            data.currentMonthStats || {
              currentIncome: 0,
              currentExpense: 0,
              previousIncome: 0,
              previousExpense: 0,
            }
          );
        } else {
          console.error("Failed to fetch monthly data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching monthly data:", error);
      }
    };

    fetchMonthlyData();
  }, [userId]);

  // Add new state for user account data
  const [userAccount, setUserAccount] = useState<{
    name: string;
    balance: number;
  }>({
    name: "Cash",
    balance: 0,
  });

  // Add function to fetch user profile
  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (response.ok) {
        setUserAccount({
          name: data.kas,
          balance: data.initial_balance,
        });
      } else {
        console.error("Failed to fetch user profile:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Add useEffect to fetch user profile
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang di halaman dashboard!
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Keluar..." : "Logout"}
        </Button>
      </div>

      {/* Goal Section */}
      {!hasGoal ? (
        <div className="mb-6">
          <Card className="w-full bg-white shadow-lg border-2 border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="text-gray-400 text-lg font-medium mb-4">
                  Goal
                </div>
                <Link href="/user/goals/add">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-green-500 border-green-500 hover:bg-green-50 rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Goal
                  </Button>
                </Link>
              </div>
              <div className="flex justify-center">
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : goal ? (
        <div className="relative mb-6 mr-6">
          <Card className="shadow-lg border-0 rounded-2xl overflow-visible">
            <CardContent className="p-6">
              {/* Header with title only */}
              <div className="mb-4">
                <h3 className="text-xl font-bold">{goal.destination}</h3>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-2 flex-1 mr-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{
                        width: `${Math.max(0, Math.min(100, progress))}%`,
                      }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-green-600 min-w-[60px] text-right">
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Amount display */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-base text-gray-600">Rp</span>
                  <span className="text-2xl font-bold text-black">
                    {goal.current_amount.toLocaleString("id-ID")}
                  </span>
                  <span className="text-base text-gray-600 mx-1">/</span>
                  <span className="text-xl font-semibold text-green-600">
                    {goal.total_budget.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Min weekly amount */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">
                  Min month to reach goal
                </span>
                <span className="text-base font-bold text-black">
                  Rp {goal.minWeekly.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Target date with edit button */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Target Date</span>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-black">
                    {formatDate(goal.end_date)}
                  </span>
                  <Link href={`/user/goals/update/${goal.id}`}>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white h-8 px-5 rounded-lg font-medium"
                    >
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            size="icon"
            className="absolute top-1 -right-13 w-10 h-10 rounded-full bg-white hover:bg-green-600 text-white shadow-xl z-20 group"
            onClick={() => setShowAddAmountModal(true)}
          >
            <Plus className="w-7 h-7 text-green-500 group-hover:text-white" />
          </Button>
        </div>
      ) : null}

      {/* Bar Chart - Income vs Expense Comparison */}
      <Card className="mb-6 shadow-lg mr-6">
        <CardHeader>
          <CardTitle className="text-lg">Grafik Arus Kas</CardTitle>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Perbandingan pemasukkan dan pengeluaran bulanan
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  monthlyChartData.length > 0 ? monthlyChartData : monthlyData
                }
                margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  fontSize={12}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [
                    `Rp ${value.toLocaleString("id-ID")}`,
                    value ===
                    (monthlyChartData.length > 0
                      ? monthlyChartData
                      : monthlyData
                    ).find((d) => d.pemasukkan === value)?.pemasukkan
                      ? "Pemasukkan"
                      : "Pengeluaran",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="pemasukkan"
                  fill="var(--color-pemasukkan)"
                  name="Pemasukkan"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="pengeluaran"
                  fill="var(--color-pengeluaran)"
                  name="Pengeluaran"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Keterangan singkat di bawah grafik */}
          <div className="mt-4">
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-3 max-w-md">
              <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center text-white">
                i
              </div>
              <div className="text-sm text-gray-700">
                <span>Kamu memiliki sisa uang </span>
                <span className="font-semibold">
                  {isSavingMore ? "lebih banyak" : "lebih sedikit"}
                </span>
                <span> </span>
                <span
                  className={`font-semibold ${
                    isSavingMore ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Rp {savingsChangeFormatted}
                </span>
                <span> dibanding bulan lalu</span>
                {savingsChange !== 0 && (
                  <>
                    <span className="text-xs block mt-1">
                      Sisa bulan ini: Rp{" "}
                      {currentSavings.toLocaleString("id-ID")}| Bulan lalu: Rp{" "}
                      {previousSavings.toLocaleString("id-ID")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts - Income and Expense Breakdown */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6 mr-6">
        {/* Income Pie Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Grafik Pemasukkan</CardTitle>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  Bulan ini
                </span>
                <span className="text-2xl font-bold text-black">
                  Rp {totalIncomeData.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  vs periode sebelumnya
                </div>
                <div
                  className={`mt-1 text-sm font-semibold ${
                    incomeChangePercent >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {incomeChangePercent >= 0 ? "+" : ""}
                  {incomeChangePercent}%
                </div>
              </div>
            </div>

            {/* Chart + Legend side-by-side */}
            <div className="flex items-center gap-6">
              <div className="w-2/3 h-[300px]">
                {realIncomeData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={realIncomeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {realIncomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number) => [
                            `Rp ${value.toLocaleString("id-ID")}`,
                            "Jumlah",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-sm">Tidak ada data</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-1/3 h-[300px] flex flex-col justify-center items-start space-y-2">
                {realIncomeData.length > 0 ? (
                  realIncomeData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 text-center w-full">
                    Tidak ada data pemasukkan
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Pie Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Grafik Pengeluaran</CardTitle>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  Bulan ini
                </span>
                <span className="text-2xl font-bold text-black">
                  Rp {totalExpenseData.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  vs periode sebelumnya
                </div>
                <div
                  className={`mt-1 text-sm font-semibold ${
                    expenseChangePercent >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {expenseChangePercent >= 0 ? "+" : ""}
                  {expenseChangePercent}%
                </div>
              </div>
            </div>

            {/* Chart + Legend side-by-side */}
            <div className="flex items-center gap-6">
              <div className="w-2/3 h-[300px]">
                {realExpenseData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={realExpenseData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {realExpenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value: number) => [
                            `Rp ${value.toLocaleString("id-ID")}`,
                            "Jumlah",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-sm">Tidak ada data</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-1/3 h-[300px] flex flex-col justify-center items-start space-y-2">
                {realExpenseData.length > 0 ? (
                  realExpenseData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 text-center w-full">
                    Tidak ada data pengeluaran
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="shadow-lg mr-6">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-lg">Transaksi Terakhir</CardTitle>
            <p className="text-sm text-gray-500">
              {showAllTransactions
                ? `${allTransactions.length} transaksi`
                : "5 transaksi terbaru"}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactionsToShow.length > 0 ? (
              showAllTransactions ? (
                // Show grouped transactions when expanded
                groupedTransactions.map(([date, dateTransactions]) => (
                  <div key={date} className="space-y-3">
                    {/* Date Header */}
                    <div className="sticky top-0 bg-gray-50 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-600">
                        {formatDateGroup(date)}
                      </h3>
                    </div>

                    {/* Transactions for this date */}
                    <div className="space-y-2">
                      {dateTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          {/* Icon */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              transaction.type === "income"
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <ArrowUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-red-600" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Category and Amount */}
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm text-gray-900">
                                {transaction.categories.name}
                              </p>
                              <span
                                className={`font-bold text-sm ${
                                  transaction.type === "income"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.type === "income" ? "+" : "-"}Rp{" "}
                                {transaction.amount.toLocaleString("id-ID")}
                              </span>
                            </div>

                            {/* Note */}
                            {transaction.note && (
                              <p className="text-xs text-gray-600 mb-2 break-words">
                                {transaction.note}
                              </p>
                            )}

                            {/* Time and Type */}
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                {getTimeAgo(transaction.date_transaction)}
                              </p>
                              <span className="text-xs text-gray-400 capitalize">
                                {transaction.type === "income"
                                  ? "Pemasukkan"
                                  : "Pengeluaran"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Show simple list when collapsed (first 5)
                <div className="space-y-3">
                  {transactionsToShow.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transaction.type === "income"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Category and Amount */}
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-gray-900">
                            {transaction.categories.name}
                          </p>
                          <span
                            className={`font-bold text-sm ${
                              transaction.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}Rp{" "}
                            {transaction.amount.toLocaleString("id-ID")}
                          </span>
                        </div>

                        {/* Note */}
                        {transaction.note && (
                          <p className="text-xs text-gray-600 mb-1 truncate">
                            {transaction.note.length > 80
                              ? `${transaction.note.slice(0, 80)}...`
                              : transaction.note}
                          </p>
                        )}

                        {/* Time and Type */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {getTimeAgo(transaction.date_transaction)}
                          </p>
                          <span className="text-xs text-gray-400 capitalize">
                            {transaction.type === "income"
                              ? "Pemasukkan"
                              : "Pengeluaran"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="text-2xl">💳</div>
                </div>
                <div className="text-sm font-medium mb-1">
                  Belum ada transaksi
                </div>
                <div className="text-xs">
                  Mulai catat transaksi pertama Anda
                </div>
                <Button
                  size="sm"
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => router.push("/user/transactions/add")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </div>
            )}
          </div>

          {/* Summary when showing all transactions */}
          {showAllTransactions && allTransactions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-700 mb-1">
                    Total Pemasukkan
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    Rp{" "}
                    {allTransactions
                      .filter((t) => t.type === "income")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-700 mb-1">Total Pengeluaran</p>
                  <p className="text-lg font-bold text-red-600">
                    Rp{" "}
                    {allTransactions
                      .filter((t) => t.type === "expense")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show More/Less Button at the bottom */}
          {allTransactions.length > 5 && (
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50 w-full"
              >
                {showAllTransactions ? "Lihat Sedikit" : "Lihat Lebih"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button - opens add menu modal */}
      <Button
        onClick={() => setShowAddMenu(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Add Menu Modal */}
      <Dialog open={showAddMenu} onOpenChange={setShowAddMenu}>
        <DialogContent className="max-w-xs mx-auto">
          <div className="p-4 space-y-3">
            {/* top card with account name + amount (now using real data) */}
            <div className="bg-gray-200 rounded-lg p-4 text-center">
              <div className="text-lg font-bold">{userAccount.name}</div>
              <div className="text-xl font-semibold mt-2">
                Rp {userAccount.balance.toLocaleString("id-ID")}
              </div>
            </div>

            {/* small pager dots */}
            <div className="flex justify-center mt-2">
              <div className="w-6 h-2 rounded-full bg-green-600" />
              <div className="w-2 h-2 rounded-full bg-gray-300 ml-2" />
              <div className="w-2 h-2 rounded-full bg-gray-300 ml-2" />
            </div>

            {/* action buttons */}
            <div className="flex flex-col gap-3 mt-3">
              <Button
                className="w-full h-12 bg-gray-300 hover:bg-gray-300 text-white rounded-lg"
                onClick={() => {
                  setShowAddMenu(false);
                  // router.push('/user/transactions/upload'); // optional
                }}
              >
                Upload
              </Button>

              <Button
                className="w-full h-12 bg-gray-400 hover:bg-gray-400 text-white rounded-lg"
                onClick={() => {
                  setShowAddMenu(false);
                  router.push("/user/transactions/add");
                }}
              >
                Manual
              </Button>

              <Button
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                onClick={() => {
                  setShowAddMenu(false);
                  // router.push('/user/transactions/photo');
                }}
              >
                Foto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Amount Modal - Only show if hasGoal */}
      {hasGoal && goal && (
        <Dialog open={showAddAmountModal} onOpenChange={setShowAddAmountModal}>
          <DialogContent className="max-w-sm mx-auto top-[15%] translate-y-0">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">
                Tambah Tabungan
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-4">
              <div className="text-center">
                <div className="text-5xl font-light text-gray-400 mb-6">
                  Rp {addAmount ? formatRupiah(addAmount) : "0"}
                </div>
                <Input
                  type="text"
                  placeholder="Masukkan jumlah..."
                  value={addAmount}
                  onChange={(e) => setAddAmount(formatRupiah(e.target.value))}
                  className="text-center text-xl border-2 border-gray-200 bg-white h-14 rounded-xl"
                />
              </div>
              <Button
                onClick={handleAddSavings}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-semibold text-base"
                disabled={!addAmount || parseAmount(addAmount) <= 0}
              >
                Tetapkan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
