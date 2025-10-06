# cli.py
import asyncio, logging, os

from .db import init_db_connection, check_connection, reconnect_db
from .scrape_core import init_browser, collect_offer_links, process_offers

def check_required_env_vars():
    """Check if required environment variables are set."""
    # Check for AWS RDS configuration first
    aws_endpoint = os.getenv('AWS_DB_ENDPOINT')
    aws_username = os.getenv('AWS_DB_USERNAME')
    aws_password = os.getenv('AWS_DB_PASSWORD')
    
    if aws_endpoint and aws_username and aws_password:
        return  # AWS configuration is complete
    
    # Check for DATABASE_URL
    if os.getenv('DATABASE_URL'):
        return  # DATABASE_URL is set
    
    # Check for local database configuration
    if os.getenv('DB_PASSWORD'):
        return  # Local database configuration is complete
    
    # No valid configuration found
    raise ValueError("Missing required environment variables. Please set either:\n"
                    "1. AWS RDS: AWS_DB_ENDPOINT, AWS_DB_USERNAME, AWS_DB_PASSWORD\n"
                    "2. DATABASE_URL: Complete database connection string\n"
                    "3. Local DB: DB_PASSWORD (with optional DB_USER, DB_HOST, DB_PORT, DB_NAME)")

# Logging configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

async def main():
    """
    Main entry point for scraping JustJoin.it job offers.

    This function orchestrates the entire scraping process:
    - Validates environment variables and establishes database connection.
    - Initializes browser and navigates to JustJoin.it.
    - Collects job offer links and determines new offers.
    - Processes new offers and inserts them into the database.
    - Closes all resources and logs completion.
    """

    # Check required environment variables on startup
    try:
        check_required_env_vars()
        logging.info("✅ Environment check passed")
    except ValueError as e:
        logging.error(f"❌ Environment check failed: {e}")
        return

    # Browser mode configuration from environment
    headless = os.getenv('HEADLESS', 'true').lower() == 'true'

    conn = await init_db_connection()
    playwright, browser, page = await init_browser(headless=headless)

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
        
        logging.info(f"🎉 Scraping completed successfully!")
        logging.info(f"📊 Total offers processed: {processed_count}")

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