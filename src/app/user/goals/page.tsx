"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GoalsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
  });

  const handleSave = () => {
    // Here you would typically save to your state management or API
    console.log("Saving goal:", formData);

    // For now, just redirect back to dashboard
    router.push("/user/dashboard");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-200 hover:bg-gray-300 w-8 h-8 sm:w-10 sm:h-10"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Goals</h1>
        </div>
      </div>

      {/* Goals Form */}
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">
              My Savings Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label
                  htmlFor="title"
                  className="text-sm sm:text-base font-medium text-gray-700"
                >
                  Goal Title
                </Label>
                <Input
                  id="title"
                  placeholder="Japan Trip"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 sm:mt-2 h-10 sm:h-12 bg-gray-50 border border-gray-200 rounded-lg text-sm sm:text-base"
                />
              </div>

              <div>
                <Label
                  htmlFor="targetAmount"
                  className="text-sm sm:text-base font-medium text-gray-700"
                >
                  Target Amount (Rp)
                </Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="20000000"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                  className="mt-1 sm:mt-2 h-10 sm:h-12 bg-gray-50 border border-gray-200 rounded-lg text-sm sm:text-base"
                />
              </div>

              <div>
                <Label
                  htmlFor="currentAmount"
                  className="text-sm sm:text-base font-medium text-gray-700"
                >
                  Current Amount (Rp)
                </Label>
                <Input
                  id="currentAmount"
                  type="number"
                  placeholder="6200000"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: e.target.value })
                  }
                  className="mt-1 sm:mt-2 h-10 sm:h-12 bg-gray-50 border border-gray-200 rounded-lg text-sm sm:text-base"
                />
              </div>

              <div>
                <Label
                  htmlFor="targetDate"
                  className="text-sm sm:text-base font-medium text-gray-700"
                >
                  Target Date
                </Label>
                <div className="relative">
                  <Input
                    id="targetDate"
                    placeholder="12/20/2025"
                    value={formData.targetDate}
                    onChange={(e) =>
                      setFormData({ ...formData, targetDate: e.target.value })
                    }
                    className="mt-1 sm:mt-2 h-10 sm:h-12 bg-gray-50 border border-gray-200 rounded-lg pr-10 text-sm sm:text-base"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-1">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
              <Button
                onClick={handleSave}
                className="w-full h-10 sm:h-12 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg text-sm sm:text-base"
              >
                Save Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
