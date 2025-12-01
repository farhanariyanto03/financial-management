"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarChartCard, IncomeChartCard, ExpenseChartCard } from "./ChartCards";

interface MobileChartSwiperProps {
  incomeData: Array<{ name: string; value: number; fill: string }>;
  expenseData: Array<{ name: string; value: number; fill: string }>;
  monthlyData: Array<{
    month: string;
    pemasukkan: number;
    pengeluaran: number;
  }>;
  totalIncome: number;
  totalExpense: number;
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

export default function MobileChartSwiper({
  incomeData,
  expenseData,
  monthlyData,
  totalIncome,
  totalExpense,
  incomeChangePercent,
  expenseChangePercent,
  savingsInfo,
}: MobileChartSwiperProps) {
  const [currentChartIndex, setCurrentChartIndex] = useState(0);

  const nextChart = () => {
    setCurrentChartIndex((prev) => (prev + 1) % 3);
  };

  const prevChart = () => {
    setCurrentChartIndex((prev) => (prev - 1 + 3) % 3);
  };

  const goToChart = (index: number) => {
    setCurrentChartIndex(index);
  };

  return (
    <div className="mb-6 relative">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentChartIndex === 0 && "Grafik Pemasukkan"}
            {currentChartIndex === 1 && "Grafik Pengeluaran"}
            {currentChartIndex === 2 && "Grafik Arus Kas"}
          </CardTitle>
          <div className="text-xs text-gray-500">
            {currentChartIndex === 2
              ? "Perbandingan pemasukkan dan pengeluaran bulanan"
              : new Date().toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
          </div>
        </CardHeader>
        <CardContent className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={prevChart}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg z-10 hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={nextChart}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg z-10 hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {currentChartIndex === 0 && (
            <IncomeChartCard
              incomeData={incomeData}
              totalIncome={totalIncome}
              changePercent={incomeChangePercent}
            />
          )}

          {currentChartIndex === 1 && (
            <ExpenseChartCard
              expenseData={expenseData}
              totalExpense={totalExpense}
              changePercent={expenseChangePercent}
            />
          )}

          {currentChartIndex === 2 && (
            <BarChartCard monthlyData={monthlyData} savingsInfo={savingsInfo} />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center mt-4 space-x-2">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => goToChart(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentChartIndex === index ? "bg-green-500" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
