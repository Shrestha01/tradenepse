import SymbolSearch from "@/components/SymbolSearch";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
          Trade<span className="text-blue-500">Nepse</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Local floorsheet analytics and broker tracking for the Nepal Stock
          Exchange.
        </p>
      </div>

      {/* Search Bar Component */}
      <div className="w-full max-w-2xl">
        <SymbolSearch />
      </div>

      {/* Quick Links / Shortcuts */}
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <p className="w-full text-center text-slate-500 text-sm mb-2">
          Popular Searches
        </p>
        {["NICA", "ADBL", "NTC", "HDL", "SHL"].map((ticker) => (
          <a
            key={ticker}
            href={`/analysis/${ticker}`}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-slate-300 text-sm hover:border-blue-500 hover:text-blue-400 transition-colors"
          >
            {ticker}
          </a>
        ))}
      </div>

      {/* Status Footer */}
      <div className="absolute bottom-8 text-slate-600 text-xs flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Connected to Local PostgreSQL
      </div>
    </main>
  );
}
