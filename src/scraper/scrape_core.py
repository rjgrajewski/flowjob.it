# scrape_core.py
import asyncio
import re
from playwright.async_api import async_playwright, Browser, Page
import logging

try:
    from ..validation.models import JobOfferData
    from ..validation.validators import validate_job_offer_data, sanitize_string
except ImportError:
    # Fallback for direct execution
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from validation.models import JobOfferData
    from validation.validators import validate_job_offer_data, sanitize_string

SCROLL_PAUSE = 0.512
SCROLL_STEP = None

async def init_browser(headless: bool = True):
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=headless)
    page = await browser.new_page()
    return playwright, browser, page

async def get_scroll_step(page: Page) -> float:
    """
    Calculates 80% of the viewport height to use as the scroll step.
    """
    viewport_height = await page.evaluate("() => window.innerHeight")
    return float(viewport_height) * 0.8

async def wait_for_new_offers(page: Page, seen_links: set[str]) -> bool:
    """
    Scrolls the page asynchronously until new job offer cards appear or until
    no new offers are detected for MAX_IDLE consecutive scrolls.
    Returns True if new offers found, False otherwise.
    """
    idle_count = 0
    MAX_IDLE = 5
    # Calculate scroll step if not set
    global SCROLL_STEP
    if SCROLL_STEP is None:
        SCROLL_STEP = await get_scroll_step(page)
    while True:
        await page.mouse.wheel(0, SCROLL_STEP)
        await asyncio.sleep(SCROLL_PAUSE)
        offer_cards = await page.query_selector_all("a.offer-card")
        new_found = False
        for offer_card in offer_cards:
            href = await offer_card.get_attribute("href")
            if href and href not in seen_links:
                new_found = True
                break
        if new_found:
            return True
        idle_count += 1
        if idle_count >= MAX_IDLE:
            return False
        
async def collect_offer_links(page: Page, max_offers: int = None) -> list[str]:
    """
    Scrolls and collects job offer links from the page asynchronously.
    
    Args:
        page: The Playwright page object
        max_offers: Maximum number of offers to collect (None = no limit)
    """
    seen_links: set[str] = set()
    collected_links = []
    consecutive_no_new_count = 0
    max_consecutive_no_new = 3  # Stop after 3 consecutive scrolls with no new offers
    
    while max_offers is None or len(collected_links) < max_offers:
        has_new = await wait_for_new_offers(page, seen_links)
        offer_cards = await page.query_selector_all("a.offer-card")
        new_data = 0
        
        for offer_card in offer_cards:
            href = await offer_card.get_attribute("href")
            if not href or href in seen_links:
                continue
            seen_links.add(href)
            collected_links.append(href)
            new_data += 1
            
            # Stop if we've reached the maximum
            if max_offers is not None and len(collected_links) >= max_offers:
                logging.info(f"Reached maximum limit of {max_offers} offers")
                break
        
        logging.info(f"Total job offers found: {len(collected_links)}")
        
        # Check if we found new offers in this iteration
        if new_data > 0:
            consecutive_no_new_count = 0
        else:
            consecutive_no_new_count += 1
            
        # Stop if no new offers found for several consecutive scrolls
        if not has_new or consecutive_no_new_count >= max_consecutive_no_new:
            logging.info(f"Stopping collection: no new offers found for {consecutive_no_new_count} consecutive scrolls")
            break
            
        # Stop if we've reached the maximum
        if max_offers is not None and len(collected_links) >= max_offers:
            break
            
    return collected_links

async def process_offers(browser: Browser, new_links: list[str], existing_urls: set[str], conn, config) -> int:
    """
    Visit each offer link asynchronously, extract job details, and save to database immediately.
    Returns the number of successfully processed offers.
    """
    processed_count = 0
    for i, href in enumerate(new_links, start=1):
        job_page = None
        try:
            job_url = "https://justjoin.it" + href
            job_page = await browser.new_page()
            await job_page.goto(job_url, timeout=30000)
            await job_page.wait_for_selector("h1")
            
            # Extract data using specific selectors
            job_title = ""
            company = ""
            location = ""
            category = ""
            
            # Get job title
            try:
                title_el = await job_page.query_selector('h1')
                if title_el:
                    job_title = await title_el.inner_text()
            except Exception:
                pass
            
            # Get company name using XPath
            try:
                company_element = await job_page.query_selector("xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[2]/div[2]/a/p")
                if company_element:
                    company = await company_element.inner_text()
            except Exception:
                pass
            
            # Get location using XPath
            try:
                location_element = await job_page.query_selector("xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[2]/div/div/nav/ol/li[3]/a")
                if location_element:
                    # Get the full text content of the element
                    location = await location_element.inner_text()
            except Exception:
                pass
            
            # Get category using XPath
            try:
                category_element = await job_page.query_selector("xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[2]/div[1]/div")
                if category_element:
                    category = await category_element.inner_text()
            except Exception:
                pass
            # Extract salary information for different employment types
            salary_any = None
            salary_b2b = None
            salary_internship = None
            salary_mandate = None
            salary_perm = None
            salary_specific_task = None
            
            try:
                # Get all text content from the page and look for salary patterns
                page_text = await job_page.evaluate("() => document.body.textContent || ''")
                
                # Look for salary patterns with employment type context
                # Pattern for B2B: "3 291 - 4 114 USD Net per month - B2B"
                # Pattern for Permanent: "2 468 - 3 291 USD Gross per month - Permanent"
                
                # B2B patterns
                b2b_patterns = [
                    r'(\d+(?:\s+\d+)*)\s*-\s*(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)\s*(?:Net|net)\s*per\s*(month|hour|day|year)\s*-\s*B2B',
                    r'(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)\s*(?:Net|net)\s*per\s*(month|hour|day|year)\s*-\s*B2B',
                    r'(\d+(?:\s+\d+)*)\s*-\s*(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)\s*-\s*B2B',
                    r'(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)\s*-\s*B2B'
                ]
                
                # Permanent patterns
                perm_patterns = [
                    r'(\d+(?:\s+\d+)*)\s*-\s*(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)\s*(?:Gross|gross)\s*per\s*(month|hour|day|year)\s*-\s*Permanent',
                    r'(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)\s*(?:Gross|gross)\s*per\s*(month|hour|day|year)\s*-\s*Permanent',
                    r'(\d+(?:\s+\d+)*)\s*-\s*(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)\s*-\s*Permanent',
                    r'(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)\s*-\s*Permanent'
                ]
                
                # General patterns (fallback)
                general_patterns = [
                    r'(\d+(?:\s+\d+)*)\s*-\s*(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)/(month|hour|day|year)',
                    r'(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)/(month|hour|day|year)',
                    r'(\d+(?:\s+\d+)*)\s*-\s*(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)',
                    r'(\d+(?:\s+\d+)*)\s*(PLN|EUR|USD|zł)'
                ]
                
                # Try B2B patterns first
                for pattern in b2b_patterns:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match:
                        if len(match.groups()) >= 3:
                            if len(match.groups()) == 4:
                                # Range format
                                min_str = match.group(1).replace(' ', '')
                                max_str = match.group(2).replace(' ', '')
                                salary_b2b = f"{min_str} - {max_str} {match.group(3)}"
                            else:
                                # Single value
                                amount_str = match.group(1).replace(' ', '')
                                salary_b2b = f"{amount_str} {match.group(2)}"
                        break
                
                # Try Permanent patterns
                for pattern in perm_patterns:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match:
                        if len(match.groups()) >= 3:
                            if len(match.groups()) == 4:
                                # Range format
                                min_str = match.group(1).replace(' ', '')
                                max_str = match.group(2).replace(' ', '')
                                salary_perm = f"{min_str} - {max_str} {match.group(3)}"
                            else:
                                # Single value
                                amount_str = match.group(1).replace(' ', '')
                                salary_perm = f"{amount_str} {match.group(2)}"
                        break
                
                # If no specific type found, try general patterns
                if not salary_b2b and not salary_perm:
                    for pattern in general_patterns:
                        match = re.search(pattern, page_text, re.IGNORECASE)
                        if match:
                            if len(match.groups()) >= 3:
                                if len(match.groups()) == 4:
                                    # Range format
                                    min_str = match.group(1).replace(' ', '')
                                    max_str = match.group(2).replace(' ', '')
                                    salary_any = f"{min_str} - {max_str} {match.group(3)}"
                                else:
                                    # Single value
                                    amount_str = match.group(1).replace(' ', '')
                                    salary_any = f"{amount_str} {match.group(2)}"
                            break
                        
            except Exception as e:
                print(f"Error extracting salary: {e}")
                pass
            # Get work type, experience, employment type, and operating mode from the job details section
            work_type = "N/A"
            experience = "N/A"
            employment_type = "N/A"
            operating_mode = "N/A"
            
            try:
                # Find the container with job details
                job_details_container = await job_page.query_selector("div.MuiBox-root.mui-1gtg48d")
                if job_details_container:
                    # Get all the job detail elements
                    detail_elements = await job_details_container.query_selector_all("div.MuiStack-root.mui-aa3a55")
                    
                    # Extract text from each element
                    details = []
                    for element in detail_elements:
                        text = await element.inner_text()
                        if text and text.strip():
                            details.append(text.strip())
                    
                    # Map the details to our fields
                    # Based on the HTML structure, the order should be:
                    # 1. Work type (Full-time)
                    # 2. Employment type (B2B)
                    # 3. Experience (Mid)
                    # 4. Operating mode (Remote)
                    
                    if len(details) >= 1:
                        work_type = details[0]
                    if len(details) >= 2:
                        employment_type = details[1]
                    if len(details) >= 3:
                        experience = details[2]
                    if len(details) >= 4:
                        operating_mode = details[3]
                        
            except Exception:
                pass
            # Get tech stack - try multiple approaches
            tech_stack = {}
            tech_stack_selectors = [
                "h3:text-is('Tech stack')",
                "h3:has-text('Tech stack')",
                "[data-testid*='tech-stack']",
                "div:has-text('Tech stack')"
            ]
            
            tech_stack_section = None
            for selector in tech_stack_selectors:
                try:
                    tech_stack_header = await job_page.query_selector(selector)
                    if tech_stack_header:
                        tech_stack_section = await tech_stack_header.evaluate_handle("el => el.parentElement")
                        break
                except Exception:
                    continue
            
            if tech_stack_section:
                # Try multiple selectors for skill blocks
                skill_block_selectors = [
                    "div[class*='jfr3nf']",
                    "div[class*='skill']",
                    "div[class*='tech']",
                    "div"
                ]
                
                skill_blocks = []
                for selector in skill_block_selectors:
                    try:
                        blocks = await tech_stack_section.query_selector_all(selector)
                        if blocks:
                            skill_blocks = blocks
                            break
                    except Exception:
                        continue
                
                for block in skill_blocks:
                    try:
                        name_element = await block.query_selector("h4")
                        if not name_element:
                            # Try other selectors for skill name
                            name_selectors = ["h4", "h3", "h2", "span", "div"]
                            for name_sel in name_selectors:
                                name_element = await block.query_selector(name_sel)
                                if name_element:
                                    break
                        
                        if name_element:
                            name = (await name_element.inner_text()).strip()
                            if name and len(name) > 0:
                                # Try to get description
                                description_element = await block.query_selector("ul + span")
                                if not description_element:
                                    description_element = await block.query_selector("span")
                                
                                desc = "N/A"
                                if description_element:
                                    desc = await description_element.inner_text()
                                
                                tech_stack[name] = desc
                    except Exception:
                        continue
            # Prepare data for validation
            tech_stack_formatted = "; ".join(
                f"{name}: {desc}" for name, desc in tech_stack.items()
            )
            
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
                "salary_perm": sanitize_string(salary_perm),
                "salary_specific_task": sanitize_string(salary_specific_task),
                "work_type": sanitize_string(work_type),
                "experience": sanitize_string(experience),
                "employment_type": sanitize_string(employment_type),
                "operating_mode": sanitize_string(operating_mode),
                "tech_stack": sanitize_string(tech_stack_formatted)
            }
            
            # Validate offer data before saving
            try:
                validated_offer = validate_job_offer_data(offer_data)
                logging.info(f"{i}: {validated_offer.job_title}")
                
                # Save to database immediately if it's a new offer
                if job_url not in existing_urls:
                    try:
                        await conn.execute(
                            """
                            INSERT INTO offers (job_url, job_title, category, company, location, salary_any, salary_b2b, salary_internship, salary_mandate, salary_perm, salary_specific_task, work_type, experience, employment_type, operating_mode, tech_stack)
                            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                            ON CONFLICT (job_url) DO NOTHING
                            """,
                            validated_offer.job_url, validated_offer.job_title, validated_offer.category, 
                            validated_offer.company, validated_offer.location, validated_offer.salary_any, 
                            validated_offer.salary_b2b, validated_offer.salary_internship, validated_offer.salary_mandate, 
                            validated_offer.salary_perm, validated_offer.salary_specific_task, validated_offer.work_type, 
                            validated_offer.experience, validated_offer.employment_type, validated_offer.operating_mode, 
                            validated_offer.tech_stack
                        )
                        existing_urls.add(job_url)
                        processed_count += 1
                        if processed_count % 10 == 0:  # Log progress every 10 offers
                            logging.info(f"✅ Saved {processed_count} offers to database")
                    except Exception as db_error:
                        logging.error(f"Database error saving offer {job_url}: {db_error}")
                        # If it's a connection error, we'll let the caller handle reconnection
                        if "connection is closed" in str(db_error).lower():
                            raise db_error
                            
            except ValueError as validation_error:
                logging.error(f"Validation failed for offer {job_url}: {validation_error}")
                # Skip this offer but continue processing others
                continue
        except Exception as e:
            logging.error(f"Error processing job offer {href}: {e}")
        finally:
            if job_page:
                await job_page.close()
    return processed_count
