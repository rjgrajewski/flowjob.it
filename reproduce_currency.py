import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        # Mimic config: headless=True
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Navigating to JustJoin.it...")
        await page.goto("https://justjoin.it/job-offers")
        await page.wait_for_timeout(5000)  # Wait for load
        
        # Check specific salary elements
        # Using a broad selector to catch salary info
        salary_elements = await page.locator("span").all()
        
        count = 0
        for span in salary_elements:
            text = await span.inner_text()
            if "EUR" in text or "PLN" in text or "USD" in text:
                 # Check if it looks like a salary range
                 if any(char.isdigit() for char in text):
                     print(f"Found salary text: {text}")
                     count += 1
                     if count >= 5:
                         break
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
