import React from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LayoutDashboard, TrendingUp } from "lucide-react";

const Navbar = async () => {
  const { userId } = await auth();
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-md border-b border-slate-800/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <TrendingUp className="text-white w-5 h-5" />
            </div>

            <span className="text-xl font-bold text-white tracking-tight">
              Trade<span className="text-blue-500">Nepse</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!userId ? (
            <div className="flex items-center gap-4">
              <SignInButton
                mode="modal"
                className="cursor-pointer"
              ></SignInButton>
              <SignUpButton
                mode="modal"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
              ></SignUpButton>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/portfolio"
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              >
                <LayoutDashboard size={16} className="text-blue-500" />
                Portfolio
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
