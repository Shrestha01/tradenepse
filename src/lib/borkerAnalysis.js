// src/lib/brokerAnalysis.js
import { db } from "@/db";
import { floorsheet, marketPrices } from "@/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";

export async function getBrokerStats(symbol) {
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
export async function getStockDetails(symbol) {
  // DEBUG: If this logs 'undefined', the query WILL fail
  console.log("Check column:", marketPrices.lastUpdated);

  const result = await db
    .select()
    .from(marketPrices)
    .where(
      and(
        eq(marketPrices.symbol, symbol),
        eq(marketPrices.businessDate, sql`CURRENT_DATE`),
      ),
    )
    .orderBy(desc(marketPrices.lastUpdated)) // Ensure this matches your schema file exactly
    .limit(1);

  // Return the first object directly, or null if nothing found
  return result.length > 0 ? result[0] : null;
}
