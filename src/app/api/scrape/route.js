import { NextResponse } from "next/server";
import {
  scrapeFloorsheet,
  scrapeTodayPrice,
  scrapeCompaniesInfo,
  scrapeBrokersInfo,
} from "@/scripts/scrape";

export async function GET() {
  try {
<<<<<<< HEAD
=======
    await scrapeFloorsheet();
>>>>>>> 672625a (clerk auth implemented)
    await scrapeTodayPrice();
    await scrapeCompaniesInfo();
    await scrapeBrokersInfo();
     await scrapeFloorsheet();
    
  } catch (error) {
    console.error("Error during scraping:", error);
  }

  return NextResponse.json({ message: "Scrape successful" });
}
