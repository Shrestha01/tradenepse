import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  date,
  timestamp,
  uniqueIndex,
  uuid,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** 1.
 * COMPANIES TABLE
 * Stores data from: https://nepalstock.com.np
 * Note: This is a "dimension table" that provides context about the stocks. It is separate from the "market_prices" table which stores daily stock data.
 */
export const companiesInfo = pgTable("companiesInfo", {
  symbol: text("symbol").primaryKey(), // Unique ticker (e.g., ADBL, NICA)
  companyName: text("company_name").notNull(), // Full legal name of listed company
  companyStatus: text("company_status"), // e.g., ACTIVE or SUSPENDED
  companySector: text("company_sector"), // e.g., Commercial Banks, Hydropower
  companyInstrument: text("company_instrument"), // e.g., Equity, Mutual Fund, Debenture
  companyEmail: text("company_email"), // Official contact email address
  companyWebsite: text("company_website"), // Official website URL
  updatedAt: timestamp("updated_at").defaultNow(), // Last time scraper touched this row
});

/** 2.
 * BROKERS TABLE
 * Stores data from: https://nepalstock.com.np
 * Note: This is a "dimension table" that provides context about the brokers. It is separate from the "broker_trades" table which stores daily trading data linked to these brokers.
 */
export const brokersInfo = pgTable("brokersInfo", {
  brokerCode: integer("broker_code").primaryKey(), // Official NEPSE ID (e.g., 58, 34, 1)
  brokerName: text("broker_name").notNull(), // Name of the brokerage firm
  contactPerson: text("contact_person"), // Primary contact person at firm
  contactNumber: text("contact_number"), // Stored as text to keep leading zeros
  status: text("status"), // Current license status (e.g., ACTIVE)
  tmsLink: text("tms_link"), // URL for their trading platform
  updatedAt: timestamp("updated_at").defaultNow(), // Tracking for data freshness
});

/* 3.
  * MARKET PRICES TABLE
  * Stores data from: https://nepalstock.com.np/stock-price
  * Note: This is a "fact table" that captures daily stock data. It is separate from the "companiesInfo" table which provides static context about the stocks.
  * Important: The 'symbol' and 'businessDate' fields together must be unique to prevent duplicate entries for the same stock on the same day.
  * This table is the primary source for all stock price data in the app.
  * The 'lastUpdated' timestamp helps us track when the scraper last updated this data, which is crucial for debugging and ensuring data freshness.
  
*/

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

/** 4.
 * FLOORSHEET TABLE
 * Stores data from: https://nepalstock.com.np/floorsheet/
 * Note: This is a "fact table" that links Brokers to Stocks to track Buy/Sell volume. It is separate from the "market_prices" table which stores daily stock data.
 */

export const floorsheet = pgTable(
  "floorsheet",
  {
    id: serial("id").primaryKey(),
    // Must be text to handle long NEPSE IDs
    contractId: text("contract_id").notNull(), //
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

/** 5.
 * BROKER DAILY TRADES (The Fact Table)
 * Purpose: Links Brokers to Stocks to track Buy/Sell volume
 */

export const brokerTrades = pgTable(
  "broker_trades",
  {
    id: serial("id").primaryKey(),
    businessDate: date("business_date").notNull(),
    brokerId: integer("broker_id").references(() => brokersInfo.brokerCode),
    symbol: text("symbol").references(() => companiesInfo.symbol),
    // FIX 1: Remove .check() from here. JS doesn't support it as a column method.
    tradeType: text("trade_type").notNull(),
    quantity: integer("quantity").notNull(),
    totalAmount: numeric("total_amount", { precision: 20, scale: 2 }),
  },
  (table) => [
    // FIX 2: Use [ ] brackets here instead of { }
    // FIX 3: Move the check constraint here
    check("trade_type_check", sql`${table.tradeType} IN ('BUY', 'SELL')`),

    uniqueIndex("unique_trade_idx").on(
      table.businessDate,
      table.brokerId,
      table.symbol,
      table.tradeType,
    ),
  ], // FIX 4: Close with ]
);

// *********************************************** PORTFOLIO TABLE (For User's Stock Holdings)
// SCHEMA FOR STORING PROTFOLIO DATA

// 1. USERS TABLE (Future Proofing)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // UUID is better for security than serial
  fullName: text("full_name").notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. PORTFOLIO TABLE (Linked to User)
export const portfolio = pgTable("portfolio", {
  id: serial("id").primaryKey(),

  // This connects the stock to a specific person
  // For now, you can hardcode a 'guest' string or a specific UUID
  userId: text("user_id").notNull(),

  symbol: text("symbol").notNull(),
  quantity: integer("quantity").notNull(),
  avgCostPrice: numeric("avg_cost_price", {
    precision: 12,
    scale: 2,
  }).notNull(),
  totalInvestment: numeric("total_investment", {
    precision: 15,
    scale: 2,
  }).notNull(),
  type: text("type").notNull().default("BUY"), // 'BUY' or 'SELL'

  purchaseDate: date("purchase_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
