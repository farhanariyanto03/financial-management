"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetItem {
  id: string;
  description: string;
  amount: string;
}

export default function AddGoalPage() {
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
  const [miscellaneous, setMiscellaneous] = useState<BudgetItem[]>([
    { id: "1", description: "", amount: "" },
  ]);
  const [emergencyPocket, setEmergencyPocket] = useState<BudgetItem[]>([
    { id: "1", description: "", amount: "" },
  ]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Goal data:", {
      formData,
      transportation,
      accommodations,
      miscellaneous,
      emergencyPocket,
    });
  };

  return (
    <div className="min-h-screen bg-white p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-6 relative">
        <Link href="/user/goals" className="absolute left-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg bg-gray-200 w-10 h-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Trip</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
        {/* Destination */}
        <div>
          <Label
            htmlFor="destination"
            className="text-base font-semibold mb-2 block"
          >
            Destination
          </Label>
          <Input
            id="destination"
            placeholder=""
            value={formData.destination}
            onChange={(e) =>
              setFormData({ ...formData, destination: e.target.value })
            }
            className="bg-gray-200 border-none h-11 rounded-lg"
          />
        </div>

        {/* Time */}
        <div>
          <Label className="text-base font-semibold mb-2 block">Time</Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={formData.timeFrom}
              onChange={(e) =>
                setFormData({ ...formData, timeFrom: e.target.value })
              }
              className="bg-gray-200 border-none h-11 rounded-lg flex-1"
            />
            <span className="text-sm font-medium px-1">to</span>
            <Input
              type="date"
              value={formData.timeTo}
              onChange={(e) =>
                setFormData({ ...formData, timeTo: e.target.value })
              }
              className="bg-gray-200 border-none h-11 rounded-lg flex-1"
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

        {/* Miscellaneous */}
        <BudgetSection
          title="Miscellaneous"
          items={miscellaneous}
          setItems={setMiscellaneous}
          updateItem={updateItem}
          addItem={addItem}
        />

        {/* Emergency pocket */}
        <BudgetSection
          title="Emergency pocket"
          items={emergencyPocket}
          setItems={setEmergencyPocket}
          updateItem={updateItem}
          addItem={addItem}
        />
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
      <Label className="text-base font-semibold mb-2 block">{title}</Label>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex gap-2">
            <Input
              placeholder=""
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
              className="flex-1 bg-gray-200 border-none h-11 rounded-lg"
            />
            <Input
              type="number"
              placeholder="IDR"
              value={item.amount}
              onChange={(e) =>
                updateItem(items, setItems, item.id, "amount", e.target.value)
              }
              className="w-28 bg-gray-200 border-none h-11 rounded-lg text-center font-medium"
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 font-normal bg-white text-sm"
          onClick={() => addItem(items, setItems)}
        >
          + Tambah
        </Button>
      </div>
    </div>
  );
}
