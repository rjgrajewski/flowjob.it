
import asyncio
import logging
import os
import sys
from dotenv import load_dotenv

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.scout.db import init_db_connection
from src.scout.scrape_core import init_browser, process_offers
from src.scout.config import ScrapingConfig

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
load_dotenv()

async def test_one():
    conn = await init_db_connection()
    try:
        url = "https://justjoin.it/job-offer/astek-polska-b2b---konsultant-eba-dora---praca-zdalna-m-k--gdansk-pomorskie--other"
        
        logging.info(f"🔧 Testing final fix for: {url}")
        
        await conn.execute("DELETE FROM offers WHERE job_url = $1", url)
        
        playwright, browser, page = await init_browser(headless=ScrapingConfig.HEADLESS)
        try:
            processed_count, page = await process_offers(page, conn, [url], browser, playwright)
            logging.info(f"✅ Successfully re-scraped {processed_count} offers.")
        finally:
            await browser.close()
            await playwright.stop()
            
    except Exception as e:
        logging.error(f"❌ Error during test: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test_one())
