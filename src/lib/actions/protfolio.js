"use server";

import { db } from "@/db/index";
import { portfolio, marketPrices } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/dist/server/api-utils";
export const dynamic = "force-dynamic";

//const TEMP_USER_ID = "92743246-c69b-45ae-804e-458783f12ec8";
const { userId } = await auth();
// 1. Updated Action to handle both BUY and SELL
export async function addStock(formData) {
  // Grab the logged-in User ID
  if (!userId) {
    redirect("/"); // If not authenticated, redirect to home/login page
  }

  const symbol = formData.get("symbol").toUpperCase();
  const quantity = parseInt(formData.get("quantity"));
  const avgCost = parseFloat(formData.get("avgCost"));
  const date = formData.get("purchaseDate");
  const type = formData.get("type") || "BUY"; // Expecting 'BUY' or 'SELL' from form

  // Total investment for this specific transaction
  const transactionValue = (quantity * avgCost).toFixed(2);

  await db.insert(portfolio).values({
    userId: userId,
    symbol,
    quantity,
    avgCostPrice: avgCost.toString(),
    totalInvestment: transactionValue,
    purchaseDate: date,
    type: type, // Ensure you have this column in your schema.js
  });

  revalidatePath("/portfolio");
}

export async function deleteStock(id) {
  await db
    .delete(portfolio)
    .where(and(eq(portfolio.id, id), eq(portfolio.userId, userId)));

  revalidatePath("/portfolio");
}

// 2. Updated Logic to aggregate BUYs and subtract SELLs
export async function getPortfolioData() {
  try {
    const rawTransactions = await db
      .select()
      .from(portfolio)
      .where(eq(portfolio.userId, userId));

    const groupedMap = new Map();

    rawTransactions.forEach((item) => {
      if (!groupedMap.has(item.symbol)) {
        groupedMap.set(item.symbol, {
          symbol: item.symbol,
          totalQty: 0,
          totalInvestment: 0,
        });
      }
      const current = groupedMap.get(item.symbol);

      if (item.type === "BUY") {
        current.totalQty += Number(item.quantity);
        current.totalInvestment += Number(item.totalInvestment);
      } else {
        // For SELLING:
        // 1. Calculate the Average Cost before this sell to remove the correct cost basis
        const currentAvgCost = current.totalInvestment / current.totalQty;

        current.totalQty -= Number(item.quantity);
        // Reduce the investment relative to the shares sold (removes cost basis)
        current.totalInvestment -= Number(item.quantity) * currentAvgCost;
      }
    });

    // Filter out stocks that are fully sold (Qty <= 0)
    const groupedStocks = Array.from(groupedMap.values()).filter(
      (s) => s.totalQty > 0,
    );

    return await Promise.all(
      groupedStocks.map(async (stock) => {
        const market = await db
          .select({ price: marketPrices.closePrice })
          .from(marketPrices)
          .where(eq(marketPrices.symbol, stock.symbol))
          .orderBy(desc(marketPrices.businessDate))
          .limit(1);

        const ltp = market[0] ? Number(market[0].price) : 0;

        const avgCost = stock.totalInvestment / stock.totalQty;
        const currentValue = stock.totalQty * ltp;
        const totalPnL = currentValue - stock.totalInvestment;
        const pnlPercentage =
          stock.totalInvestment > 0
            ? (totalPnL / stock.totalInvestment) * 100
            : 0;

        return {
          symbol: stock.symbol,
          quantity: stock.totalQty,
          avgCostPrice: avgCost.toFixed(2),
          totalInvestment: stock.totalInvestment,
          ltp: ltp,
          currentValue: currentValue,
          totalPnL: totalPnL,
          pnlPercentage: pnlPercentage,
        };
      }),
    );
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}
