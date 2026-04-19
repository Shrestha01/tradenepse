"use server";

import { db } from "@/db/index";
import { portfolio, marketPrices } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const TEMP_USER_ID = "92743246-c69b-45ae-804e-458783f12ec8";

// 1. Action to Add a Stock
export async function addStock(formData) {
  const symbol = formData.get("symbol").toUpperCase();
  const quantity = parseInt(formData.get("quantity"));
  const avgCost = formData.get("avgCost");
  const date = formData.get("purchaseDate");

  // Total Investment is static (what you actually paid)
  const totalInvestment = (quantity * parseFloat(avgCost)).toFixed(2);

  await db.insert(portfolio).values({
    userId: TEMP_USER_ID,
    symbol,
    quantity,
    avgCostPrice: avgCost,
    totalInvestment: totalInvestment,
    purchaseDate: date,
  });

  revalidatePath("/portfolio");
}

// 2. Action to Delete a Stock (Added for a complete dashboard)
export async function deleteStock(id) {
  await db
    .delete(portfolio)
    .where(and(eq(portfolio.id, id), eq(portfolio.userId, TEMP_USER_ID)));

  revalidatePath("/portfolio");
}

// 3. Action to Get Portfolio with Professional P&L Logic
// *********************************************************

export async function getPortfolioData() {
  try {
    // 1. Get all raw transaction rows for this user
    const rawStocks = await db
      .select()
      .from(portfolio)
      .where(eq(portfolio.userId, TEMP_USER_ID));

    // 2. Group by Symbol and calculate WACC (Weighted Average Cost)
    const groupedMap = new Map();

    rawStocks.forEach((item) => {
      if (!groupedMap.has(item.symbol)) {
        groupedMap.set(item.symbol, {
          symbol: item.symbol,
          totalQty: 0,
          totalInvestment: 0,
        });
      }
      const current = groupedMap.get(item.symbol);
      current.totalQty += Number(item.quantity);
      current.totalInvestment += Number(item.totalInvestment);
    });

    const groupedStocks = Array.from(groupedMap.values());

    // 3. Attach Market Price and Calculate P&L for each unique stock
    return await Promise.all(
      groupedStocks.map(async (stock) => {
        const market = await db
          .select({ price: marketPrices.closePrice })
          .from(marketPrices)
          .where(eq(marketPrices.symbol, stock.symbol))
          .orderBy(desc(marketPrices.businessDate))
          .limit(1);

        const ltp = market[0] ? Number(market[0].price) : 0;

        // Final Calculations
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
