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

interface UserProfile {
  id: string;
  username: string;
  initial_balance: number;
  kas: number;
  account_name: string;
}

export default function AddTransactionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pemasukkan");
  const [categories, setCategories] = useState<Category[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // helper: get current datetime in Jakarta (Asia/Jakarta, UTC+7) formatted for datetime-local (YYYY-MM-DDTHH:MM)
  const getJakartaLocalDatetime = () => {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value || "";

    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get(
      "minute"
    )}`;
  };

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    note: "",
    datetime: getJakartaLocalDatetime(), // Initialize with Jakarta time
  });

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (response.ok) {
        setUserProfile(data);
      } else {
        showToastError("Failed to load user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      showToastError("Failed to load user profile");
    }
  };

  // Fetch categories and user profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and profile in parallel
        await Promise.all([
          (async () => {
            const response = await fetch("/api/categories");
            const data = await response.json();
            if (response.ok) {
              setCategories(data.categories || []);
            } else {
              showToastError("Failed to load categories");
            }
          })(),
          fetchUserProfile(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        showToastError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      showToastError("Mohon isi semua field yang wajib");
      return;
    }

    const transactionAmount = parseAmount(formData.amount);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: activeTab,
          amount: transactionAmount,
          note: formData.note,
          category_id: formData.category,
          date_transaction: formData.datetime,
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

  // Calculate preview balance
  const getPreviewBalance = () => {
    // Gunakan initial_balance sebagai saldo saat ini
    const currentBalance = userProfile?.initial_balance || 0;

    if (!userProfile || !formData.amount) {
      return currentBalance;
    }

    const transactionAmount = parseAmount(formData.amount);

    if (activeTab === "pengeluaran") {
      return currentBalance - transactionAmount;
    } else {
      return currentBalance + transactionAmount;
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
            userProfile={userProfile}
            previewBalance={getPreviewBalance()}
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
            userProfile={userProfile}
            previewBalance={getPreviewBalance()}
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
  userProfile: UserProfile | null;
  previewBalance: number;
}

function TransactionForm({
  type,
  categories,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  userProfile,
  previewBalance,
}: TransactionFormProps) {
  const currentBalance = userProfile?.initial_balance || 0;
  // const transactionAmount = parseAmount(formData.amount);
  const accountName = userProfile?.account_name || "Cash";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 sm:space-y-6 max-w-md mx-auto"
    >
      {/* Cash Balance Display */}
      <Card className="bg-gray-200 border-none">
        <CardContent className="pt-4 sm:pt-6">
          <div className="text-center">
            <p className="text-sm sm:text-base font-bold mb-1">{accountName}</p>
            <div className="space-y-1">
              <p className="text-base sm:text-lg font-semibold">
                Rp {currentBalance.toLocaleString("id-ID")}
              </p>
            </div>
            {formData.amount && (
              <div className="mt-2 pt-2 border-t border-gray-300">
                <p className="text-xs text-gray-600 mb-1">
                  Saldo setelah transaksi:
                </p>
                <p
                  className={`text-sm font-semibold ${
                    previewBalance < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  Rp {previewBalance.toLocaleString("id-ID")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      <div className="space-y-3">
        <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-center text-gray-400">
          Rp {formData.amount ? formatRupiah(formData.amount) : "0"}
        </p>

        {/* Amount input */}
        <Input
          id="amount"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: formatRupiah(e.target.value) })
          }
          className="w-full border-none h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 py-0 text-center bg-gray-200"
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
