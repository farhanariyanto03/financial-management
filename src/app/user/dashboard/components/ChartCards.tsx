"use client";

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

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

interface MonthlyData {
  month: string;
  pemasukkan: number;
  pengeluaran: number;
}

interface ChartCardsProps {
  incomeData: ChartData[];
  expenseData: ChartData[];
  monthlyData: MonthlyData[];
  incomeChangePercent: number;
  expenseChangePercent: number;
  savingsInfo: {
    isSavingMore: boolean;
    savingsChangeFormatted: string;
    currentSavings: number;
    previousSavings: number;
    savingsChange: number;
  };
}

export function BarChartCard({
  monthlyData,
  savingsInfo,
}: {
  monthlyData: MonthlyData[];
  savingsInfo: ChartCardsProps["savingsInfo"];
}) {
  return (
    <Card className="mb-6 shadow-lg mr-0 lg:mr-6 w-full flex-shrink-0">
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
              data={monthlyData}
              margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                fontSize={12}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
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

        <div className="mt-4">
          <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-3 max-w-md">
            <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center text-white">
              i
            </div>
            <div className="text-sm text-gray-700">
              <span>Kamu memiliki sisa uang </span>
              <span className="font-semibold">
                {savingsInfo.isSavingMore ? "lebih banyak" : "lebih sedikit"}
              </span>
              <span> </span>
              <span
                className={`font-semibold ${
                  savingsInfo.isSavingMore ? "text-green-600" : "text-red-600"
                }`}
              >
                Rp {savingsInfo.savingsChangeFormatted}
              </span>
              <span> dibanding bulan lalu</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function IncomeChartCard({
  incomeData,
  totalIncome,
  changePercent,
}: {
  incomeData: ChartData[];
  totalIncome: number;
  changePercent: number;
}) {
  return (
    <Card className="shadow-lg w-full flex-shrink-0">
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
            <span className="text-sm font-medium text-gray-700">Bulan ini</span>
            <span className="text-2xl font-bold text-black">
              Rp {totalIncome.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">vs periode sebelumnya</div>
            <div
              className={`mt-1 text-sm font-semibold ${
                changePercent >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-2/3 h-[300px]">
            {incomeData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {incomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
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
            {incomeData.length > 0 ? (
              incomeData.map((item, index) => (
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
  );
}

export function ExpenseChartCard({
  expenseData,
  totalExpense,
  changePercent,
}: {
  expenseData: ChartData[];
  totalExpense: number;
  changePercent: number;
}) {
  return (
    <Card className="shadow-lg w-full flex-shrink-0">
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
            <span className="text-sm font-medium text-gray-700">Bulan ini</span>
            <span className="text-2xl font-bold text-black">
              Rp {totalExpense.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">vs periode sebelumnya</div>
            <div
              className={`mt-1 text-sm font-semibold ${
                changePercent <= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-2/3 h-[300px]">
            {expenseData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
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
            {expenseData.length > 0 ? (
              expenseData.map((item, index) => (
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
  );
}
