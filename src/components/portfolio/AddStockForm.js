"use client";
import { useState } from "react";
import { addStock } from "@/lib/actions/protfolio";

export default function AddStockForm() {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async (formData) => {
        setLoading(true);
        await addStock(formData);
        setLoading(false);
      }}
      className="flex flex-wrap gap-4 bg-slate-900 p-6 rounded-xl border border-slate-800"
    >
      <input
        name="symbol"
        placeholder="Symbol (NICA)"
        required
        className="bg-slate-950 border border-slate-700 p-2 rounded text-white uppercase"
      />
      <input
        name="quantity"
        type="number"
        placeholder="Qty"
        required
        className="bg-slate-950 border border-slate-700 p-2 rounded text-white"
      />
      <input
        name="avgCost"
        type="number"
        step="0.01"
        placeholder="Avg Cost"
        required
        className="bg-slate-950 border border-slate-700 p-2 rounded text-white"
      />
      <input
        name="purchaseDate"
        type="date"
        required
        defaultValue={new Date().toISOString().split("T")[0]}
        className="bg-slate-950 border border-slate-700 p-2 rounded text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 px-6 py-2 rounded font-bold hover:bg-blue-700"
      >
        {loading ? "Adding..." : "Add Stock"}
      </button>
    </form>
  );
}
