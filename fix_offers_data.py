
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

async def fix_offers():
    conn = await init_db_connection()
    try:
        # Find offers that need fixing: missing location or suspiciously low salary
        # (Using a simple heuristic for "suspiciously low" - e.g., 1000 PLN Net per day might be a common bugged value)
        query = """
            SELECT job_url 
            FROM offers 
            WHERE location IS NULL 
               OR salary_b2b ILIKE '%1000%Net%per%day%'
               OR salary_any ILIKE '%1000%Net%per%day%'
        """
        rows = await conn.fetch(query)
        urls_to_fix = [row['job_url'] for row in rows]
        
        if not urls_to_fix:
            logging.info("✨ No offers found that need fixing.")
            return

        logging.info(f"🔧 Found {len(urls_to_fix)} offers to fix.")
        
        # To use process_offers for UPDATING, we need to temporarily bypass the 'existing_urls' check 
        # OR we can just delete them first and re-scrape. Deleting is safer and easier.
        
        logging.info("🗑️  Deleting affected offers from database to allow re-scraping...")
        await conn.execute("DELETE FROM offers WHERE job_url = ANY($1)", urls_to_fix)
        
        playwright, browser, page = await init_browser(headless=ScrapingConfig.HEADLESS)
        try:
            processed_count, page = await process_offers(page, conn, urls_to_fix, browser, playwright)
            logging.info(f"✅ Successfully re-scraped {processed_count} offers.")
        finally:
            await browser.close()
            await playwright.stop()
            
    except Exception as e:
        logging.error(f"❌ Error during data fix: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(fix_offers())
