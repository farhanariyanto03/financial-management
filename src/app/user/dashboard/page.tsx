"use client";

import { useState } from "react";
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
import { Plus, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  const [hasGoal, setHasGoal] = useState(false); // Initially no goal
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddAmountModal, setShowAddAmountModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const router = useRouter();

  const [goal, setGoal] = useState({
    title: "Japan Trip",
    currentAmount: 6200000,
    targetAmount: 20000000,
    targetDate: "20/12/25",
    minWeekly: 40000,
  });

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
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

  const handleAddSavings = () => {
    if (addAmount) {
      setGoal((prev) => ({
        ...prev,
        currentAmount: prev.currentAmount + Number(addAmount),
      }));
      setAddAmount("");
      setShowAddAmountModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang di halaman dashboard!
        </p>
      </div>

      {/* Goal Section - Show empty state or actual goal */}
      {!hasGoal ? (
        <div className="mb-6">
          <Card className="w-full bg-white shadow-lg border-2 border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div className="text-gray-400 text-lg font-medium mb-4">
                  Goal
                </div>
                <Link href="/user/goals">
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
      ) : (
        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-500">
                  {progress.toFixed(0)}%
                </span>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => setShowAddAmountModal(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Progress value={progress} className="mt-2 h-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">
                  Rp {goal.currentAmount.toLocaleString("id-ID")} /{" "}
                  {goal.targetAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Min week to reach goal: Rp{" "}
                  {goal.minWeekly.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Target Date: {goal.targetDate}
                </span>
                <Link href="/user/goals">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-500 border-green-500 hover:bg-green-50"
                  >
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart - Income vs Expense Comparison */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">
            Pemasukkan & Pengeluaran (6 Bulan Terakhir)
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
      {hasGoal && (
        <Dialog open={showAddAmountModal} onOpenChange={setShowAddAmountModal}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold">
                Tambah Tabungan
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-4">
              <div className="text-center">
                <div className="text-6xl font-light text-gray-400 mb-4">
                  Rp{" "}
                  {addAmount ? Number(addAmount).toLocaleString("id-ID") : "0"}
                </div>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah..."
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="text-center text-lg border-none bg-gray-100 h-12"
                />
              </div>
              <Button
                onClick={handleAddSavings}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-medium"
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
