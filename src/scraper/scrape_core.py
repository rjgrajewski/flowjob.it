# scrape_core.py
import asyncio
import re
from playwright.async_api import async_playwright, Browser, Page
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

SCROLL_PAUSE = ScrapingConfig.SCROLL_PAUSE_TIME

async def init_browser(headless: bool = True):
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=headless)
    page = await browser.new_page()
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
            
            for i, link in enumerate(current_links):
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

async def process_offers(page: Page, conn, offer_urls: list[str]) -> int:
    """
    Process job offers and save them to the database.
    
    Args:
        page: Playwright page object
        conn: Database connection
        offer_urls: List of job offer URLs to process
    
    Returns:
        int: Number of offers processed
    """
    
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
        return 0
    
    processed_count = 0
    
    for i, href in enumerate(new_offer_urls, 1):
        try:
            logging.info(f"🔄 Processing new offer {i}/{len(new_offer_urls)}: {href}")
            
            # Navigate to the offer page
            await page.goto(href, wait_until='networkidle', timeout=ScrapingConfig.PAGE_LOAD_TIMEOUT)
            
            # Extract job details
            job_url = href
            
            # Job title
            job_title = None
            try:
                title_element = page.locator(get_selector(SELECTORS.JOB_TITLE)).first
                if await title_element.count() > 0:
                    job_title = await title_element.inner_text()
            except Exception:
                pass
            
            # Category - use the specific XPath selector
            category = None
            try:
                category_element = page.locator(get_selector(SELECTORS.CATEGORY)).first
                if await category_element.count() > 0:
                    category = await category_element.inner_text()
            except Exception:
                pass
            
            # Company - look for link with ApartmentRoundedIcon
            company = None
            try:
                company_element = page.locator(get_selector(SELECTORS.COMPANY)).first
                if await company_element.count() > 0:
                    company = await company_element.inner_text()
            except Exception:
                pass
            
            # Location - use the specific XPath selector
            location = None
            try:
                location_element = page.locator(get_selector(SELECTORS.LOCATION)).first
                if await location_element.count() > 0:
                    location = await location_element.inner_text()
            except Exception:
                pass
            
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
                print(f"❌ Error in salary extraction: {e}")
                pass
            
            # Work type - use the specific XPath selector
            work_type = None
            try:
                work_type_element = page.locator(get_selector(SELECTORS.WORK_TYPE)).first
                if await work_type_element.count() > 0:
                    work_type = await work_type_element.inner_text()
            except Exception:
                pass
            
            # Experience - use the specific XPath selector
            experience = None
            try:
                experience_element = page.locator(get_selector(SELECTORS.EXPERIENCE)).first
                if await experience_element.count() > 0:
                    experience = await experience_element.inner_text()
            except Exception:
                pass
            
            # Employment type - use the specific XPath selector
            employment_type = None
            try:
                employment_element = page.locator(get_selector(SELECTORS.EMPLOYMENT_TYPE)).first
                if await employment_element.count() > 0:
                    employment_type = await employment_element.inner_text()
            except Exception:
                pass
            
            # Operating mode - already determined in location
            operating_mode = None
            try:
                if location == 'Remote':
                    operating_mode = 'Remote'
                elif location == 'Hybrid':
                    operating_mode = 'Hybrid'
                elif location and location not in ['Remote', 'Hybrid']:
                    operating_mode = 'Office'
            except Exception:
                pass
            
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
            except Exception:
                pass
            
            # Prepare offer data
            tech_stack_formatted = "; ".join(
                f"{name}: {level}" for name, level in tech_stack.items()
            )
            
            # Debug: Log extracted data
            logging.info(f"📊 Extracted data for {job_title}:")
            
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
                "work_type": sanitize_string(work_type),
                "experience": sanitize_string(experience),
                "employment_type": sanitize_string(employment_type),
                "operating_mode": sanitize_string(operating_mode),
                "tech_stack": sanitize_string(tech_stack_formatted)
            }
            
            # Log offer data
            logging.info(f"{i}: {offer_data.get('job_title', 'Unknown title')}")
            
            # Save to database (we already filtered out existing offers)
            try:
                await conn.execute(
                    """
                    INSERT INTO offers (job_url, job_title, category, company, location, salary_any, salary_b2b, salary_internship, salary_mandate, salary_permanent, salary_specific_task, work_type, experience, employment_type, operating_mode, tech_stack)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                    """,
                    offer_data["job_url"], offer_data["job_title"], offer_data["category"], 
                    offer_data["company"], offer_data["location"], offer_data["salary_any"], 
                    offer_data["salary_b2b"], offer_data["salary_internship"], offer_data["salary_mandate"], 
                    offer_data["salary_permanent"], offer_data["salary_specific_task"], offer_data["work_type"], 
                    offer_data["experience"], offer_data["employment_type"], offer_data["operating_mode"], 
                    offer_data["tech_stack"]
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
    return processed_count