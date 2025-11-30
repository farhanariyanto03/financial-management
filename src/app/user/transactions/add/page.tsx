"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { showToastSuccess, showToastError } from "@/components/ui/alertToast";

// helper: format angka ke format ID (ribuan dengan titik)
const formatRupiah = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
};

// helper: parse string berformat rupiah -> number (mis. "1.000.000" -> 1000000)
const parseAmount = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

interface Category {
  id: string;
  name: string;
}

export default function AddTransactionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pemasukkan");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    note: "",
    datetime: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
  });

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();

        if (response.ok) {
          setCategories(data.categories || []);
        } else {
          showToastError("Failed to load categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        showToastError("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      showToastError("Mohon isi semua field yang wajib");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: activeTab,
          amount: parseAmount(formData.amount),
          note: formData.note,
          category_id: formData.category,
          date_transaction: formData.datetime, // Send full datetime
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToastSuccess("Transaksi berhasil dicatat!");
        router.push("/user/dashboard");
      } else if (response.status === 401) {
        showToastError("Sesi telah berakhir, silakan login kembali");
        router.push("/auth/login");
      } else {
        showToastError(data.error || "Gagal mencatat transaksi");
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      showToastError("Terjadi kesalahan saat mencatat transaksi");
    } finally {
      setIsSubmitting(false);
    }
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
            categories={categories}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </TabsContent>

        <TabsContent value="pengeluaran" className="mt-4 sm:mt-6">
          <TransactionForm
            type="pengeluaran"
            categories={categories}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TransactionFormProps {
  type: string;
  categories: Category[];
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

function TransactionForm({
  type,
  categories,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
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
            <p className="text-base sm:text-lg font-semibold">Rp 0</p>
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      <div className="space-y-3">
        <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-400 text-center">
          Rp {formData.amount ? formatRupiah(formData.amount) : "0"}
        </p>

        {/* Amount input — sekarang seragam dengan input lain */}
        <Input
          id="amount"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: formatRupiah(e.target.value) })
          }
          className="w-full bg-gray-200 border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0 text-center"
          required
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
            required
          >
            <SelectTrigger className="w-full bg-gray-200 border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Input
            id="datetime"
            type="datetime-local"
            value={formData.datetime}
            onChange={(e) =>
              setFormData({ ...formData, datetime: e.target.value })
            }
            className="w-full bg-gray-200 border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0 appearance-none"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl ${
          type === "pemasukkan"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-500 hover:bg-red-600"
        } disabled:opacity-50`}
      >
        {isSubmitting ? "Menyimpan..." : "Catat"}
      </Button>
    </form>
  );
}
