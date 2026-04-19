"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react"; // Make sure to npm install lucide-react

export default function SymbolSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigates to /analysis/NICA, /analysis/ADBL, etc.
      router.push(`/analysis/${query.toUpperCase().trim()}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative group">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter Stock Symbol (e.g. NICA)..."
          className="w-full bg-slate-900 border border-slate-800 text-white text-lg rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 shadow-2xl"
        />

        {/* Enter Shortcut Hint */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-800 border border-slate-700 rounded-md">
            Enter
          </kbd>
        </div>
      </div>
    </form>
  );
}
