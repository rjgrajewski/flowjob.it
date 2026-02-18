import asyncio
import os
import sys
import logging

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from scout.scrape_core import init_browser, collect_offer_links
from scout.config import ScrapingConfig

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def main():
    print(f"Current Config: SCROLL_PAUSE={ScrapingConfig.SCROLL_PAUSE_TIME}, MAX_IDLE={ScrapingConfig.MAX_IDLE_SCROLLS}")
    
    playwright, browser, page = await init_browser(headless=True)
    
    try:
        await page.goto("https://justjoin.it/job-offers", timeout=60000)
        urls = await collect_offer_links(page)
        print(f"Collected {len(urls)} offers.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    asyncio.run(main())
