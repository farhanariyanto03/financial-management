"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { showToastSuccess } from "@/components/ui/alertToast";

interface Goal {
  id: string;
  destination: string;
  current_amount: number;
  total_budget: number;
  start_date: string;
  end_date: string;
  minWeekly: number;
}

interface ModalAddTabunganProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onGoalUpdate: (updatedGoal: Goal) => void;
}

export default function ModalAddTabungan({
  isOpen,
  onClose,
  goal,
  onGoalUpdate,
}: ModalAddTabunganProps) {
  const [addAmount, setAddAmount] = useState("");

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

        // Update goal dengan minWeekly yang baru
        const updatedGoal: Goal = {
          ...goal,
          current_amount: data.totalSavings,
          minWeekly: newMinWeekly,
        };

        onGoalUpdate(updatedGoal);
        setAddAmount("");
        onClose();
        showToastSuccess("Berhasil menambahkan tabungan");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error adding savings:", error);
      alert("Gagal menambahkan tabungan");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
  );
}
