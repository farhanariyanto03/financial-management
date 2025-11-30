"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ModalAddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  account_name: string;
  username: string;
  initial_balance: number;
  current_amount: number;
}

export default function ModalAddTransaction({
  isOpen,
  onClose,
}: ModalAddTransactionProps) {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentBalance =
    userProfile?.current_amount ?? userProfile?.initial_balance ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs mx-auto">
        <div className="p-4 space-y-3">
          {/* top card with account name + amount */}
          <div className="bg-gray-200 rounded-lg p-4 text-center">
            <div className="text-lg font-bold">
              {loading ? "Loading..." : userProfile?.account_name || "Cash"}
            </div>
            <div className="text-xl font-semibold mt-2">
              {loading
                ? "Rp 0"
                : `Rp ${currentBalance.toLocaleString("id-ID")}`}
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
              disabled={loading}
              onClick={() => {
                onClose();
                // router.push('/user/transactions/upload'); // optional
              }}
            >
              Upload
            </Button>

            <Button
              className="w-full h-12 bg-gray-400 hover:bg-gray-400 text-white rounded-lg"
              disabled={loading}
              onClick={() => {
                onClose();
                router.push("/user/transactions/add");
              }}
            >
              Manual
            </Button>

            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              disabled={loading}
              onClick={() => {
                onClose();
                // router.push('/user/transactions/photo');
              }}
            >
              Foto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
