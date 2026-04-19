import { chromium } from "playwright";
import { db } from "../db/index.js";
import { floorsheet, marketPrices } from "../db/schema.js";

export async function scrapeFloorsheet() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to NEPSE Floorsheet...");
    await page.goto("https://nepalstock.com/floor-sheet/", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    try {
      console.log("Detecting current page state...");
      // Capture the first Contract ID currently on the page as a reference
      const firstIdBefore = await page
        .locator("table.table tbody tr td")
        .nth(1)
        .innerText()
        .catch(() => "");

      console.log("Setting items per page to 500...");
      const dropdown = page.locator("select").filter({ hasText: "20" }).first();
      await dropdown.waitFor({ state: "attached", timeout: 15000 });
      await dropdown.selectOption({ value: "500" });

      const filterBtn = page.locator('button:has-text("Filter")').first();
      await filterBtn.click();

      console.log("Waiting for table to update (Targeting 500 rows)...");

      // THE FIX: Wait until the first ID changes OR row count grows
      await page.waitForFunction(
        (oldId) => {
          const rows = document.querySelectorAll("table.table tbody tr");
          const firstRowId = rows[0]
            ?.querySelectorAll("td")[1]
            ?.innerText.trim();
          // Return true only when the data is fresh or the list is long
          return (firstRowId && firstRowId !== oldId) || rows.length > 20;
        },
        firstIdBefore,
        { timeout: 30000 },
      );

      // Extra settle time for NEPSE's slow rendering
      await page.waitForTimeout(5000);
      console.log("Table confirmed refreshed.");
    } catch (e) {
      console.log(`[DEBUG] Filter sync failed: ${e.message}`);
    }

    let pageCount = 1;
    const MAX_PAGES = 200;
    let totalSaved = 0;

    while (pageCount <= MAX_PAGES) {
      console.log(`Scraping Page ${pageCount}...`);

      await page.waitForSelector("table.table tbody tr td", {
        state: "visible",
        timeout: 60000,
      });

      const data = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.table tbody tr"),
        );
        return rows
          .map((row) => {
            const cols = row.querySelectorAll("td");
            if (
              cols.length < 8 ||
              row.innerText.includes("No Data") ||
              row.innerText.includes("S.N")
            )
              return null;

            const clean = (val) =>
              val ? val.innerText.trim().replace(/,/g, "") : "0";

            return {
              contractId: clean(cols[1]),
              symbol: clean(cols[2]),
              buyerBroker: parseInt(clean(cols[3])) || 0,
              sellerBroker: parseInt(clean(cols[4])) || 0,
              quantity: parseInt(clean(cols[5])) || 0,
              rate: clean(cols[6]),
              amount: clean(cols[7]),
              floorDate: new Date().toISOString().split("T")[0],
            };
          })
          .filter(Boolean);
      });

      console.log(`Page ${pageCount} raw count: ${data.length}`);

      if (data.length > 0) {
        await db
          .insert(floorsheet)
          .values(data)
          .onConflictDoNothing({ target: floorsheet.contractId });
        totalSaved += data.length;
        console.log(`Page ${pageCount}: Saved to Database.`);
      }

      if (pageCount < MAX_PAGES) {
        const nextButton = page
          .locator('li.pagination-next:not(.disabled) a, a:has-text("Next")')
          .first();
        if (await nextButton.isVisible()) {
          console.log("Navigating to next page...");
          await nextButton.click();
          await page.waitForTimeout(6000);
          pageCount++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    console.log(`Process complete. Total rows: ${totalSaved}`);
  } catch (error) {
    console.error("Scrape failed:", error.message);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}
//****************************************************** */
// FUNCTION TO SCRAPE TODAYS PRICE FROM NEPSE WEBSITE AND SAVE TO THE PROSTGRESQL DATABASE
export async function scrapeTodayPrice() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  const log = (step, message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? "❌ [ERROR]" : "✅ [INFO]";
    console.log(`${timestamp} ${prefix} [${step}] ${message}`);
  };

  try {
    log("NAVIGATION", "Opening NEPSE Today's Price...");
    await page.goto("https://nepalstock.com/today-price", {
      waitUntil: "networkidle",
      timeout: 90000,
    });

    // 1. Waiting for the table to actually appear on the screen
    log("LOADING", "Waiting for table rows...");
    await page.waitForSelector("table.table tbody tr td", { timeout: 30000 });

    // 2. Force 500 rows :: GIVING DEFAULT AS OF 500 AS THERE ARE LESS COMPANY IN NEPSE.
    try {
      const dropdown = page.locator("select").first();
      await dropdown.selectOption("500");
      await page.locator('button:has-text("Filter")').click();

      // Wait for the table to change (it will flicker)
      await page.waitForTimeout(5000);
      await page.waitForSelector("table.table tbody tr td", { timeout: 30000 });
      log("FILTER", "Applied 500 rows filter.");
    } catch (e) {
      log("FILTER", "Dropdown failed, using default view.", true);
    }

    // 3. Capture Date
    const rawDate = await page.evaluate(() => {
      const dateEl = document.querySelector(".flex-md-row b");
      return dateEl ? dateEl.innerText.trim() : "";
    });

    const businessDate = rawDate
      ? new Date(rawDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    log("DATE", `Targeting date: ${businessDate}`);

    // 4. Extraction with better Row Validation
    const rawRows = await page.evaluate(() => {
      const rows = Array.from(
        document.querySelectorAll("table.table tbody tr"),
      );
      return rows
        .map((row) => {
          const cols = Array.from(row.querySelectorAll("td")).map((td) =>
            td.innerText.trim(),
          );
          // Use a more relaxed check for row validity
          if (cols.length < 15 || isNaN(parseInt(cols[0]))) return null;
          return cols;
        })
        .filter(Boolean);
    });

    if (rawRows.length === 0) {
      log(
        "EXTRACTION",
        "Found 0 rows. The table might be empty or selectors changed.",
        true,
      );
      return;
    }

    // 5. Formatting with Regex Fix for brackets
    const formattedData = rawRows.map((cols) => {
      const clean = (val) => {
        if (!val) return "0";
        let cleaned = val
          .replace(/,/g, "")
          .replace(/\(.*\)/g, "")
          .trim();
        return cleaned === "" || cleaned === "-" ? "0" : cleaned;
      };

      return {
        // ALL THE AMOUNT ARE IN RS. AND MARKET CAP IS IN MILLION, SO NEED TO CONVERT TO ACTUAL VALUE IF NEEDED IN FUTURE
        businessDate: businessDate,
        symbol: cols[1], // SN is 0, Symbol is 1
        closePrice: clean(cols[2]) || "0", // Col 3
        openPrice: clean(cols[3]), // Col 4
        highPrice: clean(cols[4]), // Col 5
        lowPrice: clean(cols[5]), // Col 6
        totalTradedQuantity: parseInt(clean(cols[6])) || 0, // Col 7
        totalTradedValue: clean(cols[7]), // Col 8
        totalTrades: parseInt(clean(cols[8])) || 0, // Col 9
        ltp: clean(cols[9]), // Col 10 (Regex will strip brackets)
        previousClose: clean(cols[10]), // Col 11
        avgTradedPrice: clean(cols[11]), // Col 12
        fiftyTwoWeekHigh: clean(cols[12]), // Col 13
        fiftyTwoWeekLow: clean(cols[13]), // Col 14
        marketCap: clean(cols[14]), // Col 15 MARKET CAP IS IN MILLION, SO NEED TO CONVERT TO ACTUAL VALUE IF NEEDED IN FUTURE
      };
    });

    log("DATABASE", `Syncing ${formattedData.length} records...`);
    let savedCount = 0;

    for (let i = 0; i < formattedData.length; i += 50) {
      const batch = formattedData.slice(i, i + 50);
      try {
        const result = await db
          .insert(marketPrices)
          .values(batch)
          .onConflictDoNothing({
            target: [marketPrices.symbol, marketPrices.businessDate],
          });

        savedCount += batch.length;
      } catch (dbError) {
        log("DATABASE", `Batch failed: ${dbError.message}`, true);
      }
    }

    log(
      "SUMMARY",
      `Scrape Complete. Total: ${formattedData.length}, Saved: ${savedCount}`,
    );
  } catch (error) {
    log("CRITICAL", error.message, true);
  } finally {
    await browser.close();
    log("SYSTEM", "Browser closed.");
  }
}
