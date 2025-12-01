"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";

interface GoalCardProps {
  goal: {
    id: string;
    destination: string;
    current_amount: number;
    total_budget: number;
    start_date: string;
    end_date: string;
    minWeekly: number;
  };
  onAddTabungan: () => void;
}

export default function GoalCard({ goal, onAddTabungan }: GoalCardProps) {
  const [isGoalExpanded, setIsGoalExpanded] = useState(false);
  const progress = (goal.current_amount / goal.total_budget) * 100;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  return (
    <div className="mb-6 flex items-start gap-3 mr-0 lg:mr-6">
      <Card className="shadow-lg border-0 rounded-2xl overflow-visible flex-1">
        <CardContent className="p-4 lg:p-6">
          {/* Mobile View */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsGoalExpanded(!isGoalExpanded)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">{goal.destination}</h3>
                <span className="text-xl font-bold text-green-600">
                  {progress.toFixed(0)}%
                </span>
              </div>

              <div className="mb-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{
                      width: `${Math.max(0, Math.min(100, progress))}%`,
                    }}
                  />
                </div>
              </div>

              {!isGoalExpanded && (
                <div className="flex justify-center">
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </button>

            {isGoalExpanded && (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base text-gray-600">Rp</span>
                    <span className="text-2xl font-bold text-black">
                      {goal.current_amount.toLocaleString("id-ID")}
                    </span>
                    <span className="text-base text-gray-600 mx-1">/</span>
                    <span className="text-xl font-semibold text-green-600">
                      {goal.total_budget.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">
                    Min month to reach goal
                  </span>
                  <span className="text-base font-bold text-black">
                    Rp {goal.minWeekly.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Target Date</span>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-black">
                      {formatDate(goal.end_date)}
                    </span>
                    <Link href={`/user/goals/update/${goal.id}`}>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white h-8 px-4 rounded-lg font-medium"
                      >
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>

                <button
                  onClick={() => setIsGoalExpanded(false)}
                  className="w-full flex items-center justify-center py-2 text-gray-500 hover:text-gray-700"
                >
                  <ChevronDown className="w-5 h-5 rotate-180" />
                </button>
              </div>
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <div className="mb-4">
              <h3 className="text-xl font-bold">{goal.destination}</h3>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-2 flex-1 mr-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600"
                    style={{
                      width: `${Math.max(0, Math.min(100, progress))}%`,
                    }}
                  />
                </div>
                <span className="text-2xl font-bold text-green-600 min-w-[60px] text-right">
                  {progress.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-base text-gray-600">Rp</span>
                <span className="text-2xl font-bold text-black">
                  {goal.current_amount.toLocaleString("id-ID")}
                </span>
                <span className="text-base text-gray-600 mx-1">/</span>
                <span className="text-xl font-semibold text-green-600">
                  {goal.total_budget.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                Min month to reach goal
              </span>
              <span className="text-base font-bold text-black">
                Rp {goal.minWeekly.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Target Date</span>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-black">
                  {formatDate(goal.end_date)}
                </span>
                <Link href={`/user/goals/update/${goal.id}`}>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white h-8 px-5 rounded-lg font-medium"
                  >
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        size="icon"
        onClick={onAddTabungan}
        className="w-12 h-12 rounded-full bg-white hover:bg-green-600 shadow-xl group flex-shrink-0"
      >
        <Plus className="w-6 h-6 text-green-500 group-hover:text-white" />
      </Button>
    </div>
  );
}
