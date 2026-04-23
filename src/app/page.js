import SymbolSearch from "@/components/SymbolSearch";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LayoutDashboard, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Analyze the Market <br /> Like a Professional.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time floorsheet analytics, broker tracking, and portfolio
            management for the Nepal Stock Exchange.
          </p>

          {/* Search Section */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
            <div className="relative">
              <SymbolSearch />
            </div>
          </div>

          {/* Trending Chips */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mr-2">
              Trending
            </span>
            {["NICA", "ADBL", "NTC", "HDL", "SHL"].map((ticker) => (
              <Link
                key={ticker}
                href={`/analysis/${ticker}`}
                className="px-4 py-1.5 bg-slate-900/50 border border-slate-800 rounded-full text-slate-300 text-xs font-medium hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all"
              >
                {ticker}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURE CARDS */}
      <section className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:bg-slate-900/60 transition-colors">
          <h3 className="text-white font-bold mb-2">Live Floorsheet</h3>
          <p className="text-slate-500 text-sm">
            Every single trade indexed and searchable instantly from our local
            database.
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:bg-slate-900/60 transition-colors">
          <h3 className="text-white font-bold mb-2">Broker Profiling</h3>
          <p className="text-slate-500 text-sm">
            Identify buyer and seller patterns to see what big brokers are
            accumulating.
          </p>
        </div>
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:bg-slate-900/60 transition-colors">
          <h3 className="text-white font-bold mb-2">Profit Tracking</h3>
          <p className="text-slate-500 text-sm">
            Automated portfolio P&L calculation based on latest NEPSE closing
            prices.
          </p>
        </div>
      </section>

      {/* Status Footer */}
      <footer className="fixed bottom-6 w-full px-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-end">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-4 py-2 rounded-full flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Database Sync Active
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
