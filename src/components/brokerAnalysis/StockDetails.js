import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  BarChart2,
  BookOpen,
  Layers,
  Target,
  PieChart,
} from "lucide-react";
import { getStockDetails } from "@/lib/borkerAnalysis";

const StockDetail = async ({ stockDetails }) => {
  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-2xl font-sans max-w-6xl mx-auto border border-gray-700/50">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-700/50 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold">N</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {stockDetails?.symbol}
              </h2>
              <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30">
                Commercial Banks
              </span>
              <span className="bg-green-900/40 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30">
                Active
              </span>
            </div>
            <p className="text-gray-400 text-sm">NIC Asia Bank Ltd.</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-gray-400 text-sm">Rs.</span>
              <span className="text-3xl font-bold">
                {stockDetails?.closePrice}
              </span>
              <span className="text-red-500 text-sm font-semibold">-4.3</span>
              <span className="flex items-center bg-red-900/30 text-red-500 px-2 py-0.5 rounded text-xs border border-red-500/20">
                <TrendingDown className="w-3 h-3 mr-1" /> 1.17%
              </span>
            </div>
            <div className="flex items-center justify-end gap-1 text-gray-500 text-xs mt-1">
              <Clock className="w-3 h-3" />
              <span>Apr 20 02:59 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Data Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-8 gap-x-4">
        <DataPoint
          icon={<TrendingUp className="text-red-400" />}
          label="LTP"
          value={`Rs. ${stockDetails?.ltp}`}
          valueColor="text-red-400"
        />
        <DataPoint
          icon={<Activity className="text-orange-400" />}
          label="Open"
          value={`Rs. ${stockDetails?.openPrice}`}
        />
        <DataPoint
          icon={<TrendingUp className="text-green-400" />}
          label="High"
          value={`Rs. ${stockDetails?.highPrice}`}
          subValue="(1.01%)"
        />
        <DataPoint
          icon={<TrendingDown className="text-red-400" />}
          label="Low"
          value={`Rs. ${stockDetails?.lowPrice}`}
          subValue="(-1.72%)"
        />
        <DataPoint
          icon={<BarChart2 className="text-purple-400" />}
          label="Pr. Close"
          value={`Rs. ${stockDetails?.closePrice}`}
        />
        <DataPoint
          icon={<PieChart className="text-yellow-400" />}
          label="Turnover"
          value={`Rs. ${stockDetails?.turnover}`}
        />

        <DataPoint
          icon={<Layers className="text-blue-400" />}
          label="Quantity"
          value={`${stockDetails?.quantity}`}
        />
        <DataPoint
          icon={<Target className="text-blue-500" />}
          label="Trades"
          value={`${stockDetails?.totalTrades}`}
        />
        <DataPoint
          icon={<TrendingUp className="text-green-500" />}
          label="1 yr. Yield"
          value="-2.11%"
        />
        <DataPoint
          icon={<Activity className="text-teal-400" />}
          label="EPS"
          value="1.76"
        />
        <DataPoint
          icon={<Clock className="text-indigo-400" />}
          label="Fiscal Yr."
          value="082-083, Q2"
        />
        <DataPoint
          icon={<BarChart2 className="text-green-600" />}
          label="P/E Ratio"
          value="205.68"
        />

        <DataPoint
          icon={<BookOpen className="text-purple-500" />}
          label="Book Value"
          value="198.33"
        />
        <DataPoint
          icon={<Activity className="text-fuchsia-400" />}
          label="PBV"
          value="1.83"
        />
      </div>
    </div>
  );
};

const DataPoint = ({
  icon,
  label,
  value,
  subValue,
  valueColor = "text-white",
}) => (
  <div className="flex gap-3 items-start group hover:bg-white/5 p-2 rounded-lg transition-colors cursor-default">
    <div className="p-2 bg-gray-800/50 rounded-lg group-hover:bg-gray-800 transition-colors">
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
        {subValue && (
          <span className="text-[10px] text-gray-500">{subValue}</span>
        )}
      </div>
    </div>
  </div>
);

export default StockDetail;
