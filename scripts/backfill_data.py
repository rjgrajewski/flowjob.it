import asyncio
import logging
import os
import sys
from dotenv import load_dotenv

# Load env vars first
load_dotenv()

# Add src to path to allow importing scout modules
sys.path.append(os.path.join(os.getcwd(), 'src'))

# Now we can import from scout
from scout.db import init_db_connection
from scout.selectors import SELECTORS, get_selector
from scout.scrape_core import init_browser, sanitize_string
from scout.config import ScrapingConfig

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def main():
    conn = await init_db_connection()
    
    # Fetch offers with any missing data OR bad data (e.g. location = category)
    rows = await conn.fetch("""
        SELECT job_url 
        FROM offers 
        WHERE category IS NULL 
           OR company IS NULL
           OR location IS NULL
           OR work_schedule IS NULL
           OR experience IS NULL
           OR employment_type IS NULL
           OR operating_mode IS NULL
           OR location = category
    """)
    
    logging.info(f"Found {len(rows)} offers with missing data (Category, Company, Location, Schedule, Experience, Employment, Mode).")
    
    if not rows:
        logging.info("Nothing to backfill.")
        return

    playwright, browser, page = await init_browser(headless=True)
    
    try:
        for i, row in enumerate(rows, 1):
            url = row['job_url']
            logging.info(f"[{i}/{len(rows)}] Processing: {url}")
            
            try:
                await page.goto(url, wait_until='networkidle', timeout=30000)
            except Exception as e:
                logging.error(f"Failed to load {url}: {e}")
                continue

            # -------------------------------------------------------------
            # EXTRACT DATA
            # -------------------------------------------------------------
            
            # 1. Company
            company = None
            try:
                company_elem = page.locator(get_selector(SELECTORS.COMPANY)).first
                if await company_elem.count() > 0:
                    company = await company_elem.inner_text()
            except Exception as e:
                logging.warning(f"Error extracting company: {e}")

            # 2. Category - try Pill first (Red), then Breadcrumb (Yellow)
            category = None
            try:
                # Try Pill
                category_elem = page.locator(get_selector(SELECTORS.CATEGORY_PILL)).first
                if await category_elem.count() > 0:
                    category = await category_elem.inner_text()
                
                # Fallback to Breadcrumb
                if not category:
                    category_elem = page.locator(get_selector(SELECTORS.CATEGORY_BREADCRUMB)).first
                    if await category_elem.count() > 0:
                        category = await category_elem.inner_text()
            except Exception as e:
                logging.warning(f"Error extracting category: {e}")
            
            # 3. Location - try Pin Icon (Container) first, then Breadcrumb Fallback
            location = None
            try:
                location_element = page.locator(get_selector(SELECTORS.LOCATION)).first
                if await location_element.count() > 0:
                    location = await location_element.inner_text()
                
                if not location:
                    location_element = page.locator(SELECTORS.LOCATION.fallback).first
                    if await location_element.count() > 0:
                        location = await location_element.inner_text()
            except Exception as e:
                logging.warning(f"Error extracting location: {e}")
            
            # 4. Work schedule
            work_schedule = None
            try:
                work_schedule_element = page.locator(get_selector(SELECTORS.WORK_SCHEDULE)).first
                if await work_schedule_element.count() > 0:
                    work_schedule = await work_schedule_element.inner_text()
            except Exception as e:
                logging.warning(f"Error extracting work schedule: {e}")
            
            # 5. Employment type
            employment_type = None
            try:
                employment_element = page.locator(get_selector(SELECTORS.EMPLOYMENT_TYPE)).first
                if await employment_element.count() > 0:
                    employment_type = await employment_element.inner_text()
            except Exception as e:
                logging.warning(f"Error extracting employment type: {e}")
            
            # 6. Experience
            experience = None
            try:
                experience_element = page.locator(get_selector(SELECTORS.EXPERIENCE)).first
                if await experience_element.count() > 0:
                    experience = await experience_element.inner_text()
            except Exception as e:
                logging.warning(f"Error extracting experience: {e}")
            
            # 7. Operating mode
            operating_mode = None
            try:
                operating_mode_element = page.locator(get_selector(SELECTORS.OPERATING_MODE)).first
                if await operating_mode_element.count() > 0:
                    operating_mode = await operating_mode_element.inner_text()
            except Exception as e:
                logging.warning(f"Error extracting operating mode: {e}")

            # -------------------------------------------------------------
            # SANITIZE
            # -------------------------------------------------------------
            company = sanitize_string(company)
            category = sanitize_string(category)
            location = sanitize_string(location)
            work_schedule = sanitize_string(work_schedule)
            experience = sanitize_string(experience)
            employment_type = sanitize_string(employment_type)
            operating_mode = sanitize_string(operating_mode)

            # -------------------------------------------------------------
            # UPDATE DB
            # -------------------------------------------------------------
            if any([company, category, location, work_schedule, experience, employment_type, operating_mode]):
                
                fields_map = {
                    'company': company,
                    'category': category,
                    'location': location,
                    'work_schedule': work_schedule,
                    'experience': experience,
                    'employment_type': employment_type,
                    'operating_mode': operating_mode
                }
                
                found_info = ", ".join([f"{k}: {v}" for k,v in fields_map.items() if v])
                logging.info(f"   -> Found: {found_info}")
                
                update_fields = []
                values = []
                idx = 1
                
                for field, value in fields_map.items():
                    if value:
                        update_fields.append(f"{field} = ${idx}")
                        values.append(value)
                        idx += 1
                
                if update_fields:
                    values.append(url)
                    query = f"UPDATE offers SET {', '.join(update_fields)} WHERE job_url = ${idx}"
                    
                    # Retry logic for DB update
                    max_retries = 3
                    for attempt in range(max_retries):
                        try:
                            if conn.is_closed():
                                logging.warning("   -> Connection closed, reconnecting...")
                                conn = await init_db_connection()
                                
                            await conn.execute(query, *values)
                            logging.info("   -> Database updated.")
                            break
                        except Exception as e:
                            logging.error(f"   -> DB Update failed (attempt {attempt+1}/{max_retries}): {e}")
                            if attempt == max_retries - 1:
                                logging.error("   -> Skipping this update due to repeated DB errors.")
                            else:
                                await asyncio.sleep(2)
                                try:
                                    await conn.close()
                                except: 
                                    pass
            else:
                logging.warning("   -> No data found to update.")
            
            # Rate limiting
            await asyncio.sleep(1)

    finally:
        await browser.close()
        await playwright.stop()
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
