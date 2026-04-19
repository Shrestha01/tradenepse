// src/lib/brokerAnalysis.js
import { db } from "@/db";
import { floorsheet } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

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
