"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showToastError, showToastSuccess } from "@/components/ui/alertToast"; // import toast

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    kas: "", // added
    initial_balance: "", // added (string to allow empty input)
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          name: form.name,
          email: form.email,
          role: "user",
          kas: form.kas, // send as-is (string). Adjust if your API expects numeric id.
          initial_balance: form.initial_balance
            ? Number(form.initial_balance)
            : 0, // parse to number
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.error) {
        showToastError(data.error);
        return;
      }

      showToastSuccess("Register berhasil! Silakan login.");
      router.push("/login");
    } catch (err) {
      setLoading(false);
      showToastError("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#169d53] flex items-center justify-center mb-3">
              <span className="text-white font-bold text-2xl">GW</span>
            </div>
            <span className="font-bold text-2xl text-[#169d53]">
              Goal Wallet
            </span>
            <p className="text-gray-500 text-sm mt-2">Buat akun baru Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#169d53] focus:border-transparent outline-none transition"
                placeholder="Pilih username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#169d53] focus:border-transparent outline-none transition"
                placeholder="contoh@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#169d53] focus:border-transparent outline-none transition"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {/* New: Kas field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kas (nama akun)
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#169d53] focus:border-transparent outline-none transition"
                placeholder="Contoh: Kas Utama"
                value={form.kas}
                onChange={(e) => setForm({ ...form, kas: e.target.value })}
                required
              />
            </div>

            {/* New: Initial balance field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Awal (initial balance)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#169d53] focus:border-transparent outline-none transition"
                placeholder="0.00"
                value={form.initial_balance}
                onChange={(e) =>
                  setForm({ ...form, initial_balance: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#169d53] hover:bg-[#128a45] text-white py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-[#169d53] font-medium hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2024 Goal Wallet. All rights reserved.
        </p>
      </div>
    </div>
  );
}
