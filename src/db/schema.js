import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const floorsheet = pgTable(
  "floorsheet",
  {
    id: serial("id").primaryKey(),
    // Must be text to handle long NEPSE IDs
    contractId: text("contract_id").notNull(),
    floorDate: date("floor_date").notNull(),
    symbol: text("symbol").notNull(),
    buyerBroker: integer("buyer_broker").notNull(),
    sellerBroker: integer("seller_broker").notNull(),
    quantity: integer("quantity").notNull(),
    // Use text or numeric; Drizzle handles strings for numeric types
    rate: numeric("rate", { precision: 12, scale: 2 }).notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    contractIdx: uniqueIndex("contract_idx").on(table.contractId),
  }),
);

// ***********************************************
export const marketPrices = pgTable(
  "market_prices",
  {
    id: serial("id").primaryKey(),
    businessDate: date("business_date").notNull(), // The date this data belongs to

    // 1. SN (Serial Number) - We usually don't store this as it's just a row counter

    // 2. Symbol
    symbol: text("symbol").notNull(),

    // 3. Close Price
    closePrice: numeric("close_price", { precision: 12, scale: 2 }).notNull(),

    // 4. Open Price
    openPrice: numeric("open_price", { precision: 12, scale: 2 }),

    // 5. High Price
    highPrice: numeric("high_price", { precision: 12, scale: 2 }),

    // 6. Low Price
    lowPrice: numeric("low_price", { precision: 12, scale: 2 }),

    // 7. Total Traded Quantity
    totalTradedQuantity: integer("total_traded_quantity"),

    // 8. Total Traded Value
    totalTradedValue: numeric("total_traded_value", {
      precision: 20,
      scale: 2,
    }),

    // 9. Total Trades
    totalTrades: integer("total_trades"),

    // 10. LTP (Last Traded Price)
    ltp: numeric("ltp", { precision: 12, scale: 2 }),

    // 11. Previous Day Close Price
    previousClose: numeric("previous_close", { precision: 12, scale: 2 }),

    // 12. Average Traded Price
    avgTradedPrice: numeric("avg_traded_price", { precision: 12, scale: 2 }),

    // 13. 52 Week High
    fiftyTwoWeekHigh: numeric("52_week_high", { precision: 12, scale: 2 }),

    // 14. 52 Week Low
    fiftyTwoWeekLow: numeric("52_week_low", { precision: 12, scale: 2 }),

    // 15. Market Capitalization (Amt in millions)
    marketCap: numeric("market_cap", { precision: 50, scale: 2 }),

    lastUpdated: timestamp("last_updated").defaultNow(),
  },
  (table) => ({
    // Prevents duplicate entries for the same stock on the same day
    dailySymbolIdx: uniqueIndex("daily_symbol_idx").on(
      table.symbol,
      table.businessDate,
    ),
  }),
);
