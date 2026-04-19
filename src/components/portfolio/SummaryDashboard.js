import { getPortfolioData } from "@/lib/actions/protfolio";

export default async function SummaryDashboard() {
  const data = await getPortfolioData();
  // Calculate Global Summary
  const totalInvestment = data.reduce(
    (acc, s) => acc + Number(s.totalInvestment),
    0,
  );
  const totalValue = data.reduce((acc, s) => acc + Number(s.currentValue), 0);
  const totalPnL = totalValue - totalInvestment;
  const totalPnLPercent =
    totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <p className="text-slate-500 text-sm uppercase font-bold">
          Total Investment
        </p>
        <p className="text-2xl font-mono mt-2">
          Rs. {totalInvestment.toLocaleString()}
        </p>
      </div>
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <p className="text-slate-500 text-sm uppercase font-bold">
          Current Value
        </p>
        <p className="text-2xl font-mono mt-2">
          Rs. {totalValue.toLocaleString()}
        </p>
      </div>
      <div
        className={`p-6 rounded-2xl border ${totalPnL >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}
      >
        <p className="text-slate-500 text-sm uppercase font-bold">
          Overall P&L
        </p>
        <p
          className={`text-2xl font-mono mt-2 ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}
        >
          {totalPnL >= 0 ? "+" : ""}Rs. {totalPnL.toLocaleString()} (
          {totalPnLPercent.toFixed(2)}%)
        </p>
      </div>
    </div>
  );
}
