import { chromium } from "playwright";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";
import {
  floorsheet,
  marketPrices,
  companiesInfo,
  brokersInfo,
} from "../db/schema.js";

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
    const MAX_PAGES = 500;
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
  // LUNCHING A BROWSER IN THE SERVER
  const browser = await chromium.launch({
    headless: true, // helps to run the browser on server without a proper GUI.
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"], // helps to behave like a Human when accessing a web-application by seting a flag as false to navigator.webdriver(normally this is true)
  });
  // CREATE A FRESH, ISOLATED WEB BROWSWER PROFILE.
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // OPENING A NEW TAB INSIDE THE BROWSWER.
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

export async function scrapeCompaniesInfo() {
  // LUNCHING A BROWSER IN THE SERVER
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  // CREATE A FRESH, ISOLATED WEB BROWSER PROFILE.
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
    log("NAVIGATION", "Opening NEPSE Company List...");
    await page.goto("https://nepalstock.com.np/company/", {
      waitUntil: "networkidle",
      timeout: 90000,
    });

    log("LOADING", "Waiting for table rows...");
    await page.waitForSelector("table tbody tr td", { timeout: 30000 });

    let allRawRows = [];
    let hasNextPage = true;
    let pageCount = 1;

    // PAGINATION LOGIC: Loops through pages until the "Next" button is disabled
    while (hasNextPage) {
      log("PAGINATION", `Scraping Page ${pageCount}...`);

      const pageRows = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("table tbody tr"));
        return rows
          .map((row) => {
            const cols = Array.from(row.querySelectorAll("td")).map((td) =>
              td.innerText.trim(),
            );
            // Basic validation: ensures row has data and SN is a number
            if (cols.length < 5 || isNaN(parseInt(cols[0]))) return null;
            return cols;
          })
          .filter(Boolean);
      });

      allRawRows.push(...pageRows);

      // Check if "Next" button exists and is not disabled
      const nextButton = page.locator("li.pagination-next:not(.disabled) a");
      if ((await nextButton.count()) > 0) {
        await nextButton.click();
        await page.waitForTimeout(2000); // Wait for table to refresh
        pageCount++;
      } else {
        hasNextPage = false;
        log("PAGINATION", "Reached the last page.");
      }
    }

    if (allRawRows.length === 0) {
      log("EXTRACTION", "Found 0 rows. Selectors might have changed.", true);
      return;
    }

    // FORMATTING DATA
    const formattedData = allRawRows.map((cols) => {
      return {
        symbol: cols[2], // Column 2
        companyName: cols[1], // Column 3
        companySector: cols[4], // Column 4
        companyInstrument: cols[5], // Default as it's often missing in basic DOM view
        companyStatus: cols[3] || "ACTIVE", // Status usually in column 6
        companyEmail: cols[6], // Email usually requires clicking 'View'
        companyWebsite: cols[7], // Website usually in column 8
        updatedAt: new Date(),
      };
    });
    //console.log(formattedData);

    log("DATABASE", `Syncing ${formattedData.length} company records...`);
    let savedCount = 0;

    // BATCH INSERT/UPDATE
    for (let i = 0; i < formattedData.length; i += 50) {
      const batch = formattedData.slice(i, i + 50);
      try {
        await db
          .insert(companiesInfo)
          .values(batch)
          .onConflictDoUpdate({
            target: companiesInfo.symbol,
            set: {
              companyStatus: sql`EXCLUDED.company_status`,
              updatedAt: new Date(),
            },
          });
        savedCount += batch.length;
      } catch (dbError) {
        log("DATABASE", `Batch failed: ${dbError.message}`, true);
      }
    }

    log(
      "SUMMARY",
      `Scrape Complete. Total Found: ${formattedData.length}, Synced: ${savedCount}`,
    );
  } catch (error) {
    log("CRITICAL", error.message, true);
  } finally {
    await browser.close();
    log("SYSTEM", "Browser closed.");
  }
}
export async function scrapeBrokersInfo() {
  // LUNCHING A BROWSER IN THE SERVER
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  // CREATE A FRESH, ISOLATED WEB BROWSER PROFILE.
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
    log("NAVIGATION", "Opening NEPSE Broker List...");
    // Updated URL to the standard plural version
    await page.goto("https://nepalstock.com.np/brokers", {
      waitUntil: "networkidle",
      timeout: 90000,
    });

    log("LOADING", "Waiting for broker table...");
    // Use a slightly more flexible selector
    await page.waitForSelector("table tbody tr", { timeout: 30000 });

    let allRawRows = [];
    let hasNextPage = true;
    let pageCount = 1;

    // PAGINATION LOGIC
    while (hasNextPage) {
      log("PAGINATION", `Scraping Page ${pageCount}...`);

      const pageRows = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("table tbody tr"));
        return rows
          .map((row) => {
            const cols = Array.from(row.querySelectorAll("td")).map((td) =>
              td.innerText.trim(),
            );
            // Validation: Member Code is usually at index 4, S.N at index 0
            if (cols.length < 5 || isNaN(parseInt(cols[0]))) return null;
            return cols;
          })
          .filter(Boolean);
      });

      allRawRows.push(...pageRows);

      // Improved Next Button Selector (checks for text or standard class)
      const nextButton = page
        .locator(
          "li.pagination-next:not(.disabled) a, a:has-text('Next'):not(.disabled)",
        )
        .first();

      if ((await nextButton.count()) > 0 && (await nextButton.isVisible())) {
        await nextButton.click();
        log("PAGINATION", "Clicked Next...");
        await page.waitForTimeout(3000); // Wait for AJAX content swap
        pageCount++;
      } else {
        hasNextPage = false;
        log("PAGINATION", "Reached last page.");
      }
    }

    if (allRawRows.length === 0) {
      log("EXTRACTION", "No broker rows found. Check selectors.", true);
      return;
    }

    // FORMATTING DATA BASED ON BROKERSINFO SCHEMA
    // NEPSE Column Order: 0:SN, 1:Name, 2:Contact, 3:Number, 4:Code, 5:Status, 6:TMS
    const formattedData = allRawRows.map((cols) => {
      return {
        brokerCode: parseInt(cols[4]), // Primary Key
        brokerName: cols[1],
        contactPerson: cols[2] || "N/A",
        contactNumber: cols[3] || "N/A",
        status: cols[5] || "ACTIVE",
        tmsLink: cols[6] || "N/A",
        updatedAt: new Date(),
      };
    });

    log("DATABASE", `Syncing ${formattedData.length} broker records...`);
    let savedCount = 0;

    // BATCH UPSERT
    for (let i = 0; i < formattedData.length; i += 50) {
      const batch = formattedData.slice(i, i + 50);
      try {
        await db
          .insert(brokersInfo)
          .values(batch)
          .onConflictDoUpdate({
            target: brokersInfo.brokerCode,
            set: {
              brokerName: sql`EXCLUDED.broker_name`,
              status: sql`EXCLUDED.status`,
              contactNumber: sql`EXCLUDED.contact_number`,
              contactPerson: sql`EXCLUDED.contact_person`,
              tmsLink: sql`EXCLUDED.tms_link`,
              updatedAt: new Date(),
            },
          });
        savedCount += batch.length;
      } catch (dbError) {
        log("DATABASE", `Batch failed: ${dbError.message}`, true);
      }
    }

    log(
      "SUMMARY",
      `Complete. Found: ${formattedData.length}, Synced: ${savedCount}`,
    );
  } catch (error) {
    log("CRITICAL", error.message, true);
  } finally {
    await browser.close();
    log("SYSTEM", "Browser closed.");
  }
}
