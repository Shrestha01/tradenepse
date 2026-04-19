import { getPortfolioData } from "@/lib/actions/protfolio";

export default async function SummaryTable() {
  const data = await getPortfolioData();
  return (
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
  );
}
