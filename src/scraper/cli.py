# cli.py
import asyncio, logging, os

from .db import init_db_connection, check_connection, reconnect_db
from .scrape_core import init_browser, collect_offer_links, process_offers
try:
    from ..validation.config import validate_environment_on_startup
except ImportError:
    # Fallback for direct execution
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from validation.config import validate_environment_on_startup

# Logging configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

async def main():

    """
    Main entry point for scraping JustJoin.it job offers.

    - Parses command-line arguments.
    - Initializes database connection and browser.
    - Navigates to the job offers page and sets up scrolling.
    - Collects job offer links and determines new offers.
    - Processes new offers and inserts them into the database.
    - Closes all resources and logs completion.
    """

    # Validate environment variables on startup
    try:
        config = validate_environment_on_startup()
        logging.info("✅ Environment validation passed")
    except ValueError as e:
        logging.error(f"❌ Environment validation failed: {e}")
        return

    # Browser mode configuration from validated config
    headless = config.scraper.headless

    conn = await init_db_connection()
    playwright, browser, page = await init_browser(headless=headless)

    await page.goto("https://justjoin.it/job-offers/all-locations?with-salary=yes")
    global SCROLL_STEP
    SCROLL_STEP = int((await page.evaluate("() => window.innerHeight")) * 0.8)
    await page.wait_for_selector("a.offer-card")

    # Collect all available offers (with optional limit for debugging)
    max_offers = config.scraper.max_offers
    links = await collect_offer_links(page, max_offers=max_offers)
    current_urls = {"https://justjoin.it" + href for href in links}
    
    if max_offers:
        logging.info(f"🔧 Debug mode: Limited to {max_offers} offers")
    
    # Check connection health before database operations
    if not await check_connection(conn):
        logging.warning("Database connection lost, reconnecting...")
        conn = await reconnect_db(conn)
    
    existing = await conn.fetch("SELECT job_url FROM offers;")
    existing_urls = {r["job_url"] for r in existing}
    new_links = [href for href in links if ("https://justjoin.it" + href) not in existing_urls]

    logging.info(f"Found {len(new_links)} new offers")
    
    try:
        processed_count = await process_offers(browser, new_links, existing_urls, conn, config)
    except Exception as e:
        if "connection is closed" in str(e).lower():
            logging.warning("Connection lost during processing, reconnecting and retrying...")
            conn = await reconnect_db(conn)
            processed_count = await process_offers(browser, new_links, existing_urls, conn, config)
        else:
            raise e
    
    # Clean up old offers that are no longer available
    if current_urls:
        # Check connection before cleanup
        if not await check_connection(conn):
            logging.warning("Connection lost before cleanup, reconnecting...")
            conn = await reconnect_db(conn)
        
        await conn.execute(
            "DELETE FROM offers WHERE job_url NOT IN (SELECT UNNEST($1::text[]));",
            list(current_urls)
        )
        logging.info("Cleaned up old offers from database")
    
    logging.info(f"✅ Successfully processed and saved {processed_count} new offers")

    await browser.close()
    await playwright.stop()
    await conn.close()
    logging.info("Done.")

if __name__ == "__main__":
    asyncio.run(main())