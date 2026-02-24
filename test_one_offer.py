
import asyncio
import re
import json
from playwright.async_api import async_playwright
import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.scout.scrape_core import init_browser, extract_element_text, sanitize_string
from src.scout.selectors import SELECTORS, PATTERNS, get_selector

async def test_offer(url):
    playwright, browser, page = await init_browser(headless=True)
    try:
        await page.goto(url, wait_until='networkidle')
        
        job_title = await extract_element_text(page, get_selector(SELECTORS.JOB_TITLE), name="job title")
        location = await extract_element_text(page, get_selector(SELECTORS.LOCATION), fallback_selector=SELECTORS.LOCATION.fallback, name="location")
        company = await extract_element_text(page, get_selector(SELECTORS.COMPANY), name="company")
        
        print(f"Job Title: {job_title}")
        print(f"Location: {location}")
        print(f"Company: {company}")
        
        # Salary extraction
        salary_any = None
        salary_b2b = None
        
        spans = await page.locator(get_selector(SELECTORS.SALARY_SPANS)).all()
        any_pattern = PATTERNS.SALARY_ANY
        b2b_pattern = PATTERNS.SALARY_B2B
        
        for span in spans:
            span_text = await span.inner_text()
            print(f"Found Span: '{span_text}'")
            if re.match(any_pattern, span_text.strip(), re.IGNORECASE):
                parent_div = span.locator('xpath=..')
                salary_any = await parent_div.inner_text()
                print(f"Matched ANY: {salary_any}")
            elif re.match(b2b_pattern, span_text.strip(), re.IGNORECASE):
                parent_div = span.locator('xpath=..')
                salary_b2b = await parent_div.inner_text()
                print(f"Matched B2B: {salary_b2b}")

        print("\n--- FINAL DATA ---")
        print(f"Location: {location}")
        print(f"Salary Any: {salary_any}")
        print(f"Salary B2B: {salary_b2b}")
        
    finally:
        await browser.close()
        await playwright.stop()

if __name__ == "__main__":
    url = "https://justjoin.it/job-offer/astek-polska-b2b---konsultant-eba-dora---praca-zdalna-m-k--gdansk-pomorskie--other"
    asyncio.run(test_offer(url))
