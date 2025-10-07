# cli.py
import asyncio, logging
from dotenv import load_dotenv

from .db import init_db_connection, check_connection, reconnect_db, cleanup_empty_offers, purge_stale_offers
from .scrape_core import init_browser, collect_offer_links, process_offers
from .config import ScrapingConfig

# Load environment variables from .env file
load_dotenv()

# Logging configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

async def main():
    """
    Main entry point for scraping JustJoin.it job offers.

    This function orchestrates the entire scraping process:
    - Initializes browser and navigates to JustJoin.it.
    - Collects job offer links and determines new offers.
    - Processes new offers and inserts them into the database.
    - Closes all resources and logs completion.
    """

    conn = await init_db_connection()
    playwright, browser, page = await init_browser(headless=ScrapingConfig.HEADLESS)

    await page.goto("https://justjoin.it/job-offers")

    try:
        # Collect job offer links
        offer_urls = await collect_offer_links(page)
 
        if not offer_urls:
            logging.warning("⚠️ No job offer links found")
            return

        # Check connection before processing
        if not await check_connection(conn):
            logging.warning("⚠️ Database connection lost, attempting to reconnect...")
            conn = await reconnect_db()

        # Process offers and save to database
        processed_count = await process_offers(page, conn, offer_urls)
        
        # Remove stale offers that are no longer on the website
        await purge_stale_offers(conn, set(offer_urls))
        
        # Clean up offers with empty data (only job_url, all other fields NULL)
        await cleanup_empty_offers(conn)
        
        logging.info(f"🎉 Scraping completed successfully!")

    except Exception as e:
        logging.error(f"❌ Error during scraping: {e}")
        raise
    finally:
        # Clean up resources
        await conn.close()
        await browser.close()
        await playwright.stop()
        logging.info("🔒 Resources cleaned up successfully")

if __name__ == "__main__":
    asyncio.run(main())