"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddTransactionPage() {
  const [activeTab, setActiveTab] = useState("pemasukkan");
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].slice(0, 5),
  });

  const incomeCategories = [
    "Makanan & Minuman",
    "Belanja",
    "Rumah",
    "Kendaraan",
    "Hiburan",
    "Keuangan",
    "Komunikasi",
    "Investasi",
    "Pemasukkan",
    "Lainnya",
  ];
  const expenseCategories = [
    "Makanan & Minuman",
    "Belanja",
    "Rumah",
    "Kendaraan",
    "Hiburan",
    "Keuangan",
    "Komunikasi",
    "Investasi",
    "Pemasukkan",
    "Lainnya",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Transaction data:", { ...formData, type: activeTab });
    // Reset form or redirect
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Link href="/user/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-200 w-8 h-8 sm:w-10 sm:h-10"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Tambah Transaksi</h1>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-4 sm:mb-6"
      >
        <TabsList className="grid w-full grid-cols-2 bg-gray-200 h-10 sm:h-12">
          <TabsTrigger
            value="pemasukkan"
            className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-green-500 text-sm sm:text-base"
          >
            Pemasukkan
          </TabsTrigger>
          <TabsTrigger
            value="pengeluaran"
            className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-red-500 text-sm sm:text-base"
          >
            Pengeluaran
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pemasukkan" className="mt-4 sm:mt-6">
          <TransactionForm
            type="pemasukkan"
            categories={incomeCategories}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
          />
        </TabsContent>

        <TabsContent value="pengeluaran" className="mt-4 sm:mt-6">
          <TransactionForm
            type="pengeluaran"
            categories={expenseCategories}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TransactionFormProps {
  type: string;
  categories: string[];
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function TransactionForm({
  type,
  categories,
  formData,
  setFormData,
  onSubmit,
}: TransactionFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 sm:space-y-6 max-w-md mx-auto"
    >
      {/* Cash Balance Display */}
      <Card className="bg-gray-200 border-none">
        <CardContent className="pt-4 sm:pt-6">
          <div className="text-center">
            <p className="text-sm sm:text-base font-bold mb-1">Cash</p>
            <p className="text-base sm:text-lg font-semibold">Rp 800.000</p>
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      <div className="space-y-3">
        <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-400 text-center">
          Rp{" "}
          {formData.amount
            ? Number(formData.amount).toLocaleString("id-ID")
            : "0"}
        </p>

        {/* Amount input — sekarang seragam dengan input lain */}
        <Input
          id="amount"
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full bg-gray-200 border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0 text-center"
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <Input
            id="note"
            placeholder="Catatan"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full bg-gray-200 border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0"
          />
        </div>

        <div>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger className="w-full bg-gray-200 border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-gray-200 border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0 appearance-none"
          />

          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full bg-gray-200 border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0 appearance-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl ${
          type === "pemasukkan"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        Catat
      </Button>
    </form>
  );
}
