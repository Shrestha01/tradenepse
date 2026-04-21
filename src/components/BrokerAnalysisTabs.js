"use client";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function BrokerAnalysisTabs({ buyers, sellers, symbol }) {
  const [view, setView] = useState("buy"); // 'buy' or 'sell'

  const activeData = view === "buy" ? buyers : sellers;
  const activeColor = view === "buy" ? "#22c55e" : "#ef4444";

  // Format data for Recharts
  const chartData = activeData.map((b) => ({
    name: `B-${b.brokerId}`,
    qty: b.totalQty,
  }));

  return (
    <div className="space-y-6 mt-8 ">
      {/* Toggle Buttons */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full max-w-sm mx-auto">
        <button
          onClick={() => setView("buy")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            view === "buy"
              ? "bg-green-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <TrendingUp size={18} /> Buy
        </button>
        <button
          onClick={() => setView("sell")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
            view === "sell"
              ? "bg-red-600 text-white shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <TrendingDown size={18} /> Sell
        </button>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-6">
          Top 10 {view === "buy" ? "Buyers" : "Sellers"} by Quantity
        </h2>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "#1e293b" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: activeColor }}
              />
              <Bar dataKey="qty" fill={activeColor} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simplified List View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Broker</th>
              <th className="px-6 py-4 text-right">Quantity</th>
              <th className="px-6 py-4 text-right">Avg Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {activeData.map((b) => (
              <tr
                key={b.brokerId}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-white">
                  Broker {b.brokerId}
                </td>
                <td
                  className={`px-6 py-4 text-right font-mono ${view === "buy" ? "text-green-400" : "text-red-400"}`}
                >
                  {b.totalQty.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right text-slate-400">
                  Rs. {b.avgRate.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
