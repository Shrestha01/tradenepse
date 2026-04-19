import { db } from "@/db/index";
import { floorsheet } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import SymbolSearch from "@/components/SymbolSearch";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

async function getBrokerStats(symbol) {
  // 1. Get Top 10 Buyers
  const buyers = await db
    .select({
      brokerId: floorsheet.buyerBroker,
      totalQty: sql`sum(${floorsheet.quantity})`.mapWith(Number),
      avgRate: sql`avg(${floorsheet.rate})`.mapWith(Number),
    })
    .from(floorsheet)
    .where(eq(floorsheet.symbol, symbol))
    .groupBy(floorsheet.buyerBroker)
    .orderBy(sql`sum(${floorsheet.quantity}) DESC`)
    .limit(10);

  // 2. Get Top 10 Sellers
  const sellers = await db
    .select({
      brokerId: floorsheet.sellerBroker,
      totalQty: sql`sum(${floorsheet.quantity})`.mapWith(Number),
      avgRate: sql`avg(${floorsheet.rate})`.mapWith(Number),
    })
    .from(floorsheet)
    .where(eq(floorsheet.symbol, symbol))
    .groupBy(floorsheet.sellerBroker)
    .orderBy(sql`sum(${floorsheet.quantity}) DESC`)
    .limit(10);

  return { buyers, sellers };
}

export default async function AnalysisPage({ params }) {
  const { symbol } = await params;
  const { buyers, sellers } = await getBrokerStats(symbol);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      {/* Header Navigation */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-slate-900 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {symbol}{" "}
            <span className="text-slate-500 text-lg font-normal">
              Broker Analysis
            </span>
          </h1>
        </div>
        <div className="w-full md:w-96">
          <SymbolSearch />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BUYERS TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
            <TrendingUp className="text-green-500 w-5 h-5" />
            <h2 className="text-green-500 font-bold uppercase tracking-wider">
              Top 10 Buyers
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Broker</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Avg Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {buyers.map((b) => (
                <tr
                  key={b.brokerId}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    Broker {b.brokerId}
                  </td>
                  <td className="px-6 py-4 text-right text-green-400">
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

        {/* SELLERS TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
            <TrendingDown className="text-red-500 w-5 h-5" />
            <h2 className="text-red-500 font-bold uppercase tracking-wider">
              Top 10 Sellers
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Broker</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Avg Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sellers.map((s) => (
                <tr
                  key={s.brokerId}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    Broker {s.brokerId}
                  </td>
                  <td className="px-6 py-4 text-right text-red-400">
                    {s.totalQty.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">
                    Rs. {s.avgRate.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
