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
    "Gaji",
    "Freelance",
    "Investasi",
    "Bonus",
    "Lainnya",
  ];
  const expenseCategories = [
    "Makanan",
    "Transportasi",
    "Hiburan",
    "Tagihan",
    "Belanja",
    "Kesehatan",
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
      <Card className="bg-gray-100">
        <CardContent className="pt-4 sm:pt-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Cash</p>
            <p className="text-base sm:text-lg font-bold">Rp 800.000</p>
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      <div className="text-center py-4 sm:py-6">
        <Input
          type="number"
          placeholder="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="text-center text-2xl sm:text-3xl lg:text-4xl font-light border-none text-gray-400 bg-transparent mb-2 sm:mb-4"
        />
        <p className="text-3xl sm:text-4xl lg:text-6xl font-light text-gray-300">
          Rp{" "}
          {formData.amount
            ? Number(formData.amount).toLocaleString("id-ID")
            : "0"}
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <Label htmlFor="note" className="text-sm sm:text-base font-medium">
            Catatan
          </Label>
          <Input
            id="note"
            placeholder="Tambahkan catatan..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="mt-1 sm:mt-2 bg-gray-100 border-none h-10 sm:h-12 text-sm sm:text-base"
          />
        </div>

        <div>
          <Label
            htmlFor="category"
            className="text-sm sm:text-base font-medium"
          >
            Kategori
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger className="mt-1 sm:mt-2 bg-gray-100 border-none h-10 sm:h-12 text-sm sm:text-base">
              <SelectValue placeholder="Pilih kategori..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="date" className="text-sm sm:text-base font-medium">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="mt-1 sm:mt-2 bg-gray-100 border-none h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div>
            <Label htmlFor="time" className="text-sm sm:text-base font-medium">
              Time
            </Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              className="mt-1 sm:mt-2 bg-gray-100 border-none h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className={`w-full h-11 sm:h-12 text-base sm:text-lg font-medium ${
          type === "pemasukkan"
            ? "bg-green-500 hover:bg-green-600"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        Catat
      </Button>
    </form>
  );
}
