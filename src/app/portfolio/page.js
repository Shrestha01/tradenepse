import { getPortfolioData } from "@/lib/actions/protfolio";
import AddStockForm from "@/components/portfolio/AddStockForm";

export default async function PortfolioPage() {
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
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Portfolio</h1>

        {/* 1. Summary Dashboard Cards */}
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

        {/* 2. Add Transaction Section */}
        <div className="mb-10">
          <h2 className="text-xl mb-4 text-slate-400 font-semibold">
            Add New Transaction
          </h2>
          <AddStockForm />
        </div>

        {/* 3. Combined Holdings Table */}
        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">WACC (Avg. Cost)</th>
                <th className="p-4 text-right">LTP</th>
                <th className="p-4 text-right">Current Value</th>
                <th className="p-4 text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.length > 0 ? (
                data.map((s) => (
                  <tr
                    key={s.symbol}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-blue-400">{s.symbol}</td>
                    <td className="p-4 text-right font-mono">{s.quantity}</td>
                    <td className="p-4 text-right text-slate-400 font-mono">
                      Rs. {s.avgCostPrice}
                    </td>
                    <td className="p-4 text-right text-white font-bold font-mono">
                      Rs. {s.ltp}
                    </td>
                    <td className="p-4 text-right text-slate-300 font-mono">
                      Rs. {Number(s.currentValue).toLocaleString()}
                    </td>
                    <td
                      className={`p-4 text-right font-bold font-mono ${s.totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      <div>
                        {s.totalPnL >= 0 ? "+" : ""}
                        {Number(s.totalPnL).toLocaleString()}
                      </div>
                      <div className="text-[10px] opacity-70">
                        {s.pnlPercentage.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-600">
                    No stocks in portfolio. Add your first transaction above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
