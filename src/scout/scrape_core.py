# scrape_core.py
import asyncio
import re
from typing import Optional
from playwright.async_api import async_playwright, Page
import logging
from .selectors import SELECTORS, PATTERNS, get_selector
from .config import ScrapingConfig

def sanitize_string(value, max_length=None):
    """Simple string sanitization without validation."""
    if not value or not isinstance(value, str):
        return None
    # Basic cleanup
    cleaned = value.strip()
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned if cleaned else None

async def extract_element_text(page: Page, selector: str, fallback_selector: str = None, name: str = "element") -> Optional[str]:
    """Helper to safely extract text from a Playwright locator with optional fallback."""
    try:
        element = page.locator(selector).first
        if await element.count() > 0:
            return await element.inner_text()
            
        if fallback_selector:
            fallback = page.locator(fallback_selector).first
            if await fallback.count() > 0:
                return await fallback.inner_text()
    except Exception as e:
        logging.error(f"❌ Error in {name} extraction: {e}")
    return None

SCROLL_PAUSE = ScrapingConfig.SCROLL_PAUSE_TIME

async def init_browser(headless: bool = True):
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=headless)
    context = await browser.new_context(locale='pl-PL')
    page = await context.new_page()
    return playwright, browser, page

async def collect_offer_links(page: Page) -> list[str]:
    """
    Collects job offer links from JustJoin.it by scrolling through the page.
    
    Args:
        page: Playwright page object
    
    Returns:
        list[str]: List of job offer URLs
    """
    unique_urls: set[str] = set()
    idle_count = 0
    max_idle = ScrapingConfig.MAX_IDLE_SCROLLS
    
    logging.info("🔄 Starting to collect job offer links...")
    
    # Wait for page to load initially
    await asyncio.sleep(3)
    
    while True:
        
        # Get current links and extract URLs
        try:            
            current_links = await page.locator(get_selector(SELECTORS.JOB_OFFER_LINKS)).all()
            current_urls = set()
            
            for link in current_links:
                try:
                    href = await link.get_attribute('href', timeout=ScrapingConfig.LINK_TIMEOUT)
                    if href and '/job-offer/' in href:
                        if href.startswith('/'):
                            href = f"https://justjoin.it{href}"
                        current_urls.add(href)
                except Exception as e:
                    # Skip this link and continue
                    continue
                    
        except Exception as e:
            logging.warning(f"⚠️ Error getting links: {e}")
            current_urls = set()
        
        # Add new URLs to our collection
        new_urls = current_urls - unique_urls
        unique_urls.update(current_urls)
        
        logging.info(f"📊 Collected {len(unique_urls)} unique links.")
        
        if new_urls:
            idle_count = 0
        else:
            idle_count += 1
            logging.info(f"⏸️ No new links found (idle {idle_count}/{max_idle})")
            
            if idle_count >= max_idle:
                logging.info("🛑 Stopping - no new links found for 3 consecutive scrolls")
                break
        
            
        # Scroll down
        await page.evaluate("window.scrollBy(0, window.innerHeight)")
        await asyncio.sleep(SCROLL_PAUSE)
    
    offer_urls = list(unique_urls)
    logging.info(f"✅ Collected {len(offer_urls)} unique job offer links")
    return offer_urls

async def process_offers(page: Page, conn, offer_urls: list[str], browser=None, playwright=None) -> tuple[int, Page]:
    """
    Process job offers and save them to the database.
    
    Args:
        page: Playwright page object
        conn: Database connection
        offer_urls: List of job offer URLs to process
        browser: Playwright browser object (optional, for memory cleanup)
        playwright: Playwright instance (optional, for memory cleanup)
    
    Returns:
        tuple[int, Page]: Number of offers processed and the current page object
    """
    
    # Memory management: restart browser every N offers to prevent memory leaks
    can_restart = browser is not None and playwright is not None
    
    # Get existing URLs to avoid duplicates
    existing_urls = set()
    try:
        existing_records = await conn.fetch("SELECT job_url FROM offers")
        existing_urls = {record['job_url'] for record in existing_records}
        logging.info(f"📊 Found {len(existing_urls)} existing offers in database")
    except Exception as e:
        logging.warning(f"⚠️ Could not fetch existing URLs: {e}")
    
    # Filter out existing URLs before processing
    new_offer_urls = [url for url in offer_urls if url not in existing_urls]
    skipped_count = len(offer_urls) - len(new_offer_urls)
    
    logging.info(f"📊 Total collected: {len(offer_urls)} offers")
    logging.info(f"⏭️ Already in database: {skipped_count} offers")
    logging.info(f"🆕 New offers to process: {len(new_offer_urls)} offers")
    
    if not new_offer_urls:
        logging.info("✅ No new offers to process - all offers already exist in database")
        return 0, page
    
    processed_count = 0
    
    for i, href in enumerate(new_offer_urls, 1):
        try:
            # Memory cleanup: restart browser every N offers (from config)
            if can_restart and i > 1 and (i - 1) % ScrapingConfig.RESTART_BROWSER_EVERY == 0:
                logging.info(f"♻️  Restarting browser for memory cleanup (processed {i-1}/{len(new_offer_urls)} offers)")
                try:
                    await page.close()
                    await browser.close()
                    browser = await playwright.chromium.launch(headless=True)
                    context = await browser.new_context(locale='pl-PL')
                    page = await context.new_page()
                    logging.info("✅ Browser restarted successfully")
                except Exception as e:
                    logging.warning(f"⚠️  Browser restart failed: {e}, continuing with existing browser")
            
            logging.info(f"🔄 Processing new offer {i}/{len(new_offer_urls)}: {href}")
            
            # Navigate to the offer page
            await page.goto(href, wait_until='networkidle', timeout=ScrapingConfig.PAGE_LOAD_TIMEOUT)
            
            # Extract job details
            job_url = href
            
            # Extract simple fields with helper
            job_title = await extract_element_text(page, get_selector(SELECTORS.JOB_TITLE), name="job title")
            location = await extract_element_text(page, get_selector(SELECTORS.LOCATION), fallback_selector=SELECTORS.LOCATION.fallback, name="location")
            company = await extract_element_text(page, get_selector(SELECTORS.COMPANY), name="company")
            category = await extract_element_text(page, get_selector(SELECTORS.CATEGORY_PILL), fallback_selector=get_selector(SELECTORS.CATEGORY_BREADCRUMB), name="category")
            work_schedule = await extract_element_text(page, get_selector(SELECTORS.WORK_SCHEDULE), name="work schedule")
            employment_type = await extract_element_text(page, get_selector(SELECTORS.EMPLOYMENT_TYPE), name="employment type")
            experience = await extract_element_text(page, get_selector(SELECTORS.EXPERIENCE), name="experience")
            operating_mode = await extract_element_text(page, get_selector(SELECTORS.OPERATING_MODE), name="operating mode")
            description = await extract_element_text(page, get_selector(SELECTORS.JOB_DESCRIPTION), fallback_selector=SELECTORS.JOB_DESCRIPTION.fallback, name="description")
            
            # Tech stack - try multiple approaches to find tech items
            tech_stack = {}
            try:
                # Approach 1: Look for h4 elements that might be tech names
                tech_names = await page.locator(get_selector(SELECTORS.TECH_NAMES)).all()
                for name_elem in tech_names:
                    try:
                        name_text = await name_elem.inner_text()
                        if name_text and name_text.strip():
                            # Look for span element in the same parent
                            parent = name_elem.locator('..')
                            span_elem = parent.locator(get_selector(SELECTORS.TECH_LEVELS)).first
                            if await span_elem.count() > 0:
                                level_text = await span_elem.inner_text()
                                if level_text and level_text.strip():
                                    tech_stack[name_text.strip()] = level_text.strip()
                    except:
                        continue
                        
                # If no tech found, try approach 2: look for specific patterns
                if not tech_stack:
                    # Look for elements that contain both h4 and span
                    tech_containers = await page.locator(get_selector(SELECTORS.TECH_CONTAINERS)).all()
                    for container in tech_containers[:20]:  # Limit to first 20
                        try:
                            h4_elem = container.locator(get_selector(SELECTORS.TECH_NAMES)).first
                            span_elem = container.locator(get_selector(SELECTORS.TECH_LEVELS)).first
                            
                            if await h4_elem.count() > 0 and await span_elem.count() > 0:
                                name = await h4_elem.inner_text()
                                level = await span_elem.inner_text()
                                
                                if name and level and name.strip() and level.strip():
                                    # Skip if it looks like a tech stack item
                                    if len(name) < 50 and len(level) < 20:
                                        tech_stack[name.strip()] = level.strip()
                        except:
                            continue
            except Exception as e:
                logging.error(f"❌ Error in tech stack extraction: {e}")
                pass
            
            # Prepare offer data
            tech_stack_formatted = "; ".join(
                f"{name}: {level}" for name, level in tech_stack.items()
            )
            
            # Initialize all salary variables
            salary_any = None
            salary_b2b = None
            salary_internship = None
            salary_mandate = None
            salary_permanent = None
            salary_specific_task = None
            
            # Salary extraction - check all spans with " per "
            try:
                spans = await page.locator(get_selector(SELECTORS.SALARY_SPANS)).all()
                any_pattern = PATTERNS.SALARY_ANY
                b2b_pattern = PATTERNS.SALARY_B2B
                internship_pattern = PATTERNS.SALARY_INTERNSHIP
                mandate_pattern = PATTERNS.SALARY_MANDATE
                permanent_pattern = PATTERNS.SALARY_PERMANENT
                specific_task_pattern = PATTERNS.SALARY_SPECIFIC_TASK
                
                for span in spans:
                    try:
                        span_text = await span.inner_text()
                        if re.match(any_pattern, span_text.strip(), re.IGNORECASE):
                            parent_div = span.locator('xpath=..')
                            salary_any = await parent_div.inner_text()
                        elif re.match(b2b_pattern, span_text.strip(), re.IGNORECASE):
                            parent_div = span.locator('xpath=..')
                            salary_b2b = await parent_div.inner_text()
                        elif re.match(internship_pattern, span_text.strip(), re.IGNORECASE):
                            parent_div = span.locator('xpath=..')
                            salary_internship = await parent_div.inner_text()
                        elif re.match(mandate_pattern, span_text.strip(), re.IGNORECASE):
                            parent_div = span.locator('xpath=..')
                            salary_mandate = await parent_div.inner_text()
                        elif re.match(permanent_pattern, span_text.strip(), re.IGNORECASE):
                            parent_div = span.locator('xpath=..')
                            salary_permanent = await parent_div.inner_text()
                        elif re.match(specific_task_pattern, span_text.strip(), re.IGNORECASE):
                            parent_div = span.locator('xpath=..')
                            salary_specific_task = await parent_div.inner_text()
                    except Exception as span_error:
                        continue
            except Exception as e:
                logging.error(f"❌ Error in salary extraction: {e}")
                pass

            # Sanitize and prepare offer data
            offer_data = {
                "job_url": sanitize_string(job_url),
                "job_title": sanitize_string(job_title),
                "category": sanitize_string(category),
                "company": sanitize_string(company),
                "location": sanitize_string(location),
                "salary_any": sanitize_string(salary_any),
                "salary_b2b": sanitize_string(salary_b2b),
                "salary_internship": sanitize_string(salary_internship),
                "salary_mandate": sanitize_string(salary_mandate),
                "salary_permanent": sanitize_string(salary_permanent),
                "salary_specific_task": sanitize_string(salary_specific_task),
                "work_schedule": sanitize_string(work_schedule),
                "experience": sanitize_string(experience),
                "employment_type": sanitize_string(employment_type),
                "operating_mode": sanitize_string(operating_mode),
                "tech_stack": sanitize_string(tech_stack_formatted),
                "description": sanitize_string(description)
            }
            
            # Save to database (we already filtered out existing offers at the start)
            try:
                await conn.execute(
                    """
                    INSERT INTO offers (job_url, job_title, category, company, location, salary_any, salary_b2b, salary_internship, salary_mandate, salary_permanent, salary_specific_task, work_schedule, experience, employment_type, operating_mode, tech_stack, description, created_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, CURRENT_TIMESTAMP)
                    """,
                    offer_data["job_url"], offer_data["job_title"], offer_data["category"], 
                    offer_data["company"], offer_data["location"], offer_data["salary_any"], 
                    offer_data["salary_b2b"], offer_data["salary_internship"], offer_data["salary_mandate"], 
                    offer_data["salary_permanent"], offer_data["salary_specific_task"], offer_data["work_schedule"], 
                    offer_data["experience"], offer_data["employment_type"], offer_data["operating_mode"], 
                    offer_data["tech_stack"], offer_data["description"]
                )
                processed_count += 1
            except Exception as db_error:
                logging.error(f"Database error saving offer {job_url}: {db_error}")
                # If it's a connection error, we'll let the caller handle reconnection
                if "connection is closed" in str(db_error).lower():
                    raise db_error
                        
        except Exception as e:
            logging.error(f"Error processing job offer {href}: {e}")
        finally:
            # Small delay between requests to be respectful
            await asyncio.sleep(ScrapingConfig.REQUEST_DELAY)
    
    logging.info(f"✅ Processed {processed_count} new offers")
    return processed_count, page