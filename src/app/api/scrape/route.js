import { NextResponse } from "next/server";
import {
  scrapeFloorsheet,
  scrapeTodayPrice,
  scrapeCompaniesInfo,
  scrapeBrokersInfo,
} from "@/scripts/scrape";

export async function GET() {
  try {
     await scrapeFloorsheet();
    // await scrapeTodayPrice();
    //await scrapeCompaniesInfo();
    //await scrapeBrokersInfo();
  } catch (error) {
    console.error("Error during scraping:", error);
  }

  return NextResponse.json({ message: "Scrape successful" });
}
