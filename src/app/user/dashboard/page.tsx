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

// Sample data for expense chart
const expenseData = [
  { name: "Makanan", value: 3000000, fill: "#3b82f6" },
  { name: "Hiburan", value: 1500000, fill: "#06d6a0" },
  { name: "Belanja", value: 2000000, fill: "#f72585" },
  { name: "Lainnya", value: 500000, fill: "#ffd60a" },
];

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

// Sample data for income pie chart
const pemasukanData = [
  { name: "Gaji", value: 4000000, fill: "#0088FE" },
  { name: "Freelance", value: 1500000, fill: "#00C49F" },
  { name: "Investasi", value: 800000, fill: "#FFBB28" },
  { name: "Lainnya", value: 200000, fill: "#FF8042" },
];

// Sample data for expense pie chart
const pengeluaranData = [
  { name: "Makanan", value: 1500000, fill: "#FF6B6B" },
  { name: "Transportasi", value: 800000, fill: "#4ECDC4" },
  { name: "Tagihan", value: 1200000, fill: "#45B7D1" },
  { name: "Hiburan", value: 500000, fill: "#96CEB4" },
  { name: "Lainnya", value: 500000, fill: "#FECA57" },
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

// Add modal account info for the Add Menu modal
const modalAccount = { name: "Cash", balance: 800000 };

export default function DashboardPage() {
  const [hasGoal, setHasGoal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddAmountModal, setShowAddAmountModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const progress = goal ? (goal.current_amount / goal.total_budget) * 100 : 0;
  const totalExpense = expenseData.reduce((sum, item) => sum + item.value, 0);
  const totalExpenseData = pengeluaranData.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const totalIncomeData = pemasukanData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // small percentage changes to show in the pie headers (adjust as needed)
  const incomeChangePercent = 10; // positive => green
  const expenseChangePercent = -4; // negative => red

  // compute savings for the latest month (pemasukkan - pengeluaran)
  const latestMonth = monthlyData[monthlyData.length - 1];
  const savingsThisMonth = latestMonth
    ? latestMonth.pemasukkan - latestMonth.pengeluaran
    : 0;
  const savingsFormatted = Math.abs(savingsThisMonth).toLocaleString("id-ID");
  const isSavingsPositive = savingsThisMonth >= 0;

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
          amount: Number(addAmount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setGoal((prev) =>
          prev
            ? {
                ...prev,
                current_amount: data.totalSavings,
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

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
        <Card className="mb-6 shadow-lg border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            {/* Header with title and add button */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">{goal.destination}</h3>
              <Button
                size="icon"
                variant="ghost"
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex-shrink-0 -mt-1 -mr-1"
                onClick={() => setShowAddAmountModal(true)}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>

            {/* Progress bar with percentage on the right (custom green bar) */}
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
                Min week to reach goal
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
      ) : null}

      {/* Bar Chart - Income vs Expense Comparison */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">
            Grafik Arus Kas
          </CardTitle>
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
                data={monthlyData}
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
                    monthlyData.find((d) => d.pemasukkan === value)?.pemasukkan
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
                <span>Kamu </span>
                <span className="font-semibold">
                  {isSavingsPositive
                    ? "menghemat"
                    : "mengeluarkan lebih banyak dari pemasukkan"}
                </span>
                <span> </span>
                <span
                  className={`font-semibold ${
                    isSavingsPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Rp {savingsFormatted}
                </span>
                <span> di bulan ini</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts - Income and Expense Breakdown */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-6">
        {/* Income Pie Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Grafik Pemasukkan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  Minggu ini
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
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pemasukanData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pemasukanData.map((entry, index) => (
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
              </div>

              <div className="w-1/3 h-[300px] flex flex-col justify-center items-start space-y-2">
                {pemasukanData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Pie Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Grafik Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  Minggu ini
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
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pengeluaranData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pengeluaranData.map((entry, index) => (
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
              </div>

              <div className="w-1/3 h-[300px] flex flex-col justify-center items-start space-y-2">
                {pengeluaranData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Pengeluaran Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                  <div>
                    <p className="font-medium text-sm">
                      {transaction.category}
                    </p>
                    <p className="text-xs text-gray-600">{transaction.time}</p>
                  </div>
                </div>
                <span
                  className={`font-semibold text-sm ${
                    transaction.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}Rp{" "}
                  {transaction.amount.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
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
            {/* top card with account name + amount (minimal) */}
            <div className="bg-gray-200 rounded-lg p-4 text-center">
              <div className="text-lg font-bold">{modalAccount.name}</div>
              <div className="text-xl font-semibold mt-2">
                Rp {modalAccount.balance.toLocaleString("id-ID")}
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
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">
                Tambah Tabungan
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-4">
              <div className="text-center">
                <div className="text-5xl font-light text-gray-400 mb-6">
                  Rp{" "}
                  {addAmount ? Number(addAmount).toLocaleString("id-ID") : "0"}
                </div>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah..."
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="text-center text-xl border-2 border-gray-200 bg-white h-14 rounded-xl"
                />
              </div>
              <Button
                onClick={handleAddSavings}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-semibold text-base"
                disabled={!addAmount || Number(addAmount) <= 0}
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
