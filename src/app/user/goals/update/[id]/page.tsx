"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthUser } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import { showToastError, showToastSuccess } from "@/components/ui/alertToast";

interface BudgetItem {
  id: string;
  description: string;
  amount: string;
}

// Tambahkan helper di level modul agar bisa dipakai oleh komponen & BudgetSection
const formatRupiah = (value: string) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
};

const parseAmount = (val: string) => {
  if (!val) return 0;
  const digits = String(val).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

export default function UpdateGoalPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    destination: "",
    timeFrom: "",
    timeTo: "",
  });

  const [transportation, setTransportation] = useState<BudgetItem[]>([
    { id: "1", description: "", amount: "" },
  ]);
  const [accommodations, setAccommodations] = useState<BudgetItem[]>([
    { id: "1", description: "", amount: "" },
  ]);
  const [activities, setActivities] = useState<BudgetItem[]>([
    { id: "1", description: "", amount: "" },
  ]);
  const [miscellaneous, setMiscellaneous] = useState<BudgetItem[]>([
    { id: "1", description: "", amount: "" },
  ]);
  const [emergencyPocketAmount, setEmergencyPocketAmount] = useState("");

  // Fetch goal data
  useEffect(() => {
    const fetchGoal = async () => {
      // guard: don't call API if goalId is not ready
      if (!goalId) return;

      try {
        const response = await fetch(`/api/goal/${goalId}`);
        const data = await response.json();

        if (!response.ok) {
          console.error("API error fetching goal:", data);
          showToastError(data.error || "Failed to load goal data");
          return;
        }

        if (data.goal) {
          setFormData({
            destination: data.goal.destination,
            timeFrom: data.goal.start_date,
            timeTo: data.goal.end_date,
          });

          // Group items by category
          const trans: BudgetItem[] = [];
          const accom: BudgetItem[] = [];
          const act: BudgetItem[] = [];
          const misc: BudgetItem[] = [];
          let emergency = "";

          data.goal.items?.forEach((item: any, index: number) => {
            const formattedAmount = item.cost_idr
              ? new Intl.NumberFormat("id-ID").format(Number(item.cost_idr))
              : "";

            const budgetItem: BudgetItem = {
              id: `${index}`,
              description: item.item_name,
              amount: formattedAmount,
            };

            if (item.item_name === "Emergency pocket") {
              emergency = item.cost_idr.toString();
            } else if (item.goal_item_categories.name === "Transportation") {
              trans.push(budgetItem);
            } else if (item.goal_item_categories.name === "Accommodations") {
              accom.push(budgetItem);
            } else if (item.goal_item_categories.name === "Activities") {
              act.push(budgetItem);
            } else {
              misc.push(budgetItem);
            }
          });

          if (trans.length > 0) setTransportation(trans);
          if (accom.length > 0) setAccommodations(accom);
          if (act.length > 0) setActivities(act);
          if (misc.length > 0) setMiscellaneous(misc);
          // Emergency pocket: format as localized string if present
          if (emergency) {
            setEmergencyPocketAmount(
              new Intl.NumberFormat("id-ID").format(Number(emergency))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching goal:", error);
        showToastError("Failed to load goal data");
      }
    };

    fetchGoal();
  }, [goalId]);

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { user, error } = await getAuthUser();

        if (error || !user) {
          console.error("User not authenticated:", error);
          router.push("/login");
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error("Error getting user:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    getUser();
  }, [router]);

  const addItem = (
    items: BudgetItem[],
    setItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>
  ) => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      description: "",
      amount: "",
    };
    setItems([...items, newItem]);
  };

  const updateItem = (
    items: BudgetItem[],
    setItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>,
    id: string,
    field: "description" | "amount",
    value: string
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      showToastError("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      const goalItems = [
        ...transportation.map((item) => ({
          category_name: "Transportation",
          item_name: item.description,
          cost_idr: parseAmount(item.amount),
        })),
        ...accommodations.map((item) => ({
          category_name: "Accommodations",
          item_name: item.description,
          cost_idr: parseAmount(item.amount),
        })),
        ...activities.map((item) => ({
          category_name: "Activities",
          item_name: item.description,
          cost_idr: parseAmount(item.amount),
        })),
        ...miscellaneous.map((item) => ({
          category_name: "Other",
          item_name: item.description,
          cost_idr: parseAmount(item.amount),
        })),
      ].filter((item) => item.item_name && item.cost_idr > 0);

      if (emergencyPocketAmount && parseAmount(emergencyPocketAmount) > 0) {
        goalItems.push({
          category_name: "Other",
          item_name: "Emergency pocket",
          cost_idr: parseAmount(emergencyPocketAmount),
        });
      }

      const payload = {
        destination: formData.destination,
        start_date: formData.timeFrom,
        end_date: formData.timeTo,
        total_budget: total,
        goal_items: goalItems,
      };

      const response = await fetch(`/api/goal/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showToastSuccess("Goal updated successfully!");
        router.push("/user/dashboard");
      } else {
        showToastError(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      showToastError("An error occurred while updating the goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = useMemo(() => {
    const sumList = (items: BudgetItem[]) =>
      items.reduce((s, it) => s + parseAmount(it.amount), 0);

    return (
      sumList(transportation) +
      sumList(accommodations) +
      sumList(activities) +
      sumList(miscellaneous) +
      parseAmount(emergencyPocketAmount)
    );
  }, [
    transportation,
    accommodations,
    activities,
    miscellaneous,
    emergencyPocketAmount,
  ]);

  const formattedTotal = useMemo(() => {
    return new Intl.NumberFormat("id-ID").format(total);
  }, [total]);

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

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-6 relative">
        <Link href="/user/dashboard" className="absolute left-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg bg-white w-10 h-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Edit Trip</h1>
      </div>

      {/* Form - same layout as Add page */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
        {/* Destination */}
        <div>
          <Label
            htmlFor="destination"
            className="text-sm font-semibold mb-2 block"
          >
            Destination
          </Label>
          <Input
            id="destination"
            placeholder="Jepang, Tokyo"
            value={formData.destination}
            onChange={(e) =>
              setFormData({ ...formData, destination: e.target.value })
            }
            className="bg-white border border-gray-300 h-12 rounded-lg"
          />
        </div>

        {/* Time */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Time</Label>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={formData.timeFrom}
              onChange={(e) =>
                setFormData({ ...formData, timeFrom: e.target.value })
              }
              className="bg-white border border-gray-300 h-12 rounded-lg flex-1"
            />
            <span className="text-sm font-medium">to</span>
            <Input
              type="date"
              value={formData.timeTo}
              onChange={(e) =>
                setFormData({ ...formData, timeTo: e.target.value })
              }
              className="bg-white border border-gray-300 h-12 rounded-lg flex-1"
            />
          </div>
        </div>

        {/* Transportation */}
        <BudgetSection
          title="Transportation"
          items={transportation}
          setItems={setTransportation}
          updateItem={updateItem}
          addItem={addItem}
        />

        {/* Accommodations */}
        <BudgetSection
          title="Accommodations"
          items={accommodations}
          setItems={setAccommodations}
          updateItem={updateItem}
          addItem={addItem}
        />

        {/* Activities */}
        <BudgetSection
          title="Activities"
          items={activities}
          setItems={setActivities}
          updateItem={updateItem}
          addItem={addItem}
        />

        {/* Miscellaneous */}
        <BudgetSection
          title="Miscellaneous"
          items={miscellaneous}
          setItems={setMiscellaneous}
          updateItem={updateItem}
          addItem={addItem}
        />

        {/* Emergency pocket - single label + input */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">
            Emergency pocket
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              IDR
            </span>
            <Input
              type="text"
              placeholder="5,000,000"
              value={emergencyPocketAmount}
              onChange={(e) =>
                setEmergencyPocketAmount(formatRupiah(e.target.value))
              }
              className="bg-white border border-gray-300 h-12 rounded-lg pl-12 pr-3 text-right font-medium"
            />
          </div>
        </div>

        {/* ====== Total Budget & Action ====== */}
        <div className="mt-6 text-center">
          <h3 className="text-base font-medium mb-4">Total Budget</h3>

          <div className="mx-auto max-w-sm">
            <div className="border rounded-lg py-4 px-6 mb-4 flex items-center justify-center">
              <span className="text-sm text-gray-600 mr-3">IDR</span>
              <span className="text-3xl font-bold">{formattedTotal}</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#169d53] hover:bg-[#128a45] text-white py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Tetapkan"}
            </Button>
          </div>
        </div>
        {/* ====== end Total Budget ====== */}
      </form>
    </div>
  );
}

interface BudgetSectionProps {
  title: string;
  items: BudgetItem[];
  setItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  updateItem: (
    items: BudgetItem[],
    setItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>,
    id: string,
    field: "description" | "amount",
    value: string
  ) => void;
  addItem: (
    items: BudgetItem[],
    setItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>
  ) => void;
}

function BudgetSection({
  title,
  items,
  setItems,
  updateItem,
  addItem,
}: BudgetSectionProps) {
  return (
    <div>
      <Label className="text-sm font-semibold mb-3 block">{title}</Label>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <Input
              placeholder="Plane"
              value={item.description}
              onChange={(e) =>
                updateItem(
                  items,
                  setItems,
                  item.id,
                  "description",
                  e.target.value
                )
              }
              className="flex-1 bg-white border border-gray-300 h-12 rounded-lg px-4"
            />
            <div className="relative w-36">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                IDR
              </span>
              <Input
                type="text"
                placeholder="10,000,000"
                value={item.amount}
                onChange={(e) =>
                  updateItem(
                    items,
                    setItems,
                    item.id,
                    "amount",
                    // sekarang memanggil helper modul yang tersedia
                    formatRupiah(e.target.value)
                  )
                }
                className="bg-white border border-gray-300 h-12 rounded-lg pl-12 pr-3 text-right font-medium"
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 font-normal bg-gray-100 text-sm"
          onClick={() => addItem(items, setItems)}
        >
          + Tambah
        </Button>
      </div>
    </div>
  );
}
