import { NextResponse } from "next/server";
import { scrapeFloorsheet, scrapeTodayPrice } from "@/scripts/scrape";

export async function GET() {
  try {
    await scrapeFloorsheet();
    await scrapeTodayPrice();
  } catch (error) {
    console.error("Error during scraping:", error);
  }

  return NextResponse.json({ message: "Scrape successful" });
}
