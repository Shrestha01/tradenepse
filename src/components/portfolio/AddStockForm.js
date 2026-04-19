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
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4">
        <label className="flex-1 text-center cursor-pointer py-2 rounded-lg has-[:checked]:bg-blue-600 transition-all">
          <input
            type="radio"
            name="type"
            value="BUY"
            defaultChecked
            className="hidden"
          />
          <span className="text-sm font-bold">BUY</span>
        </label>
        <label className="flex-1 text-center cursor-pointer py-2 rounded-lg has-[:checked]:bg-red-600 transition-all">
          <input type="radio" name="type" value="SELL" className="hidden" />
          <span className="text-sm font-bold">SELL</span>
        </label>
      </div>

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
