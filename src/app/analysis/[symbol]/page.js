import { db } from "@/db";
import { floorsheet } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import SymbolSearch from "@/components/SymbolSearch";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BrokerAnalysisTabs from "@/components/BrokerAnalysisTabs"; // We'll create this

import { getBrokerStats, getStockDetails } from "@/lib/borkerAnalysis";
import StockDetail from "@/components/brokerAnalysis/StockDetails";

export default async function AnalysisPage({ params }) {
  const { symbol } = await params;
  const { buyers, sellers } = await getBrokerStats(symbol); // Fetch broker stats for the given symbol
  const stockDetails = await getStockDetails(symbol); // Fetch stock details for the header
  console.log("Stock Details:", stockDetails); // Debug log
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8 py-12">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-slate-900 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-white">{symbol}</h1>
        </div>
        <SymbolSearch />
      </div>
      <StockDetail stockDetails={stockDetails} />
      <div className="max-w-4xl mx-auto">
        {/* Pass data to the Client Component */}
        <BrokerAnalysisTabs buyers={buyers} sellers={sellers} symbol={symbol} />
      </div>
    </div>
  );
}
