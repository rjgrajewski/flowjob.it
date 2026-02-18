import asyncio
from playwright.async_api import async_playwright

async def check_currency(locale_code, timezone_id, lat, lng):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Grant geolocation permissions
        context = await browser.new_context(
            locale=locale_code,
            timezone_id=timezone_id,
            geolocation={"latitude": lat, "longitude": lng},
            permissions=["geolocation"]
        )
        page = await context.new_page()
        
        print(f"Testing: Locale={locale_code}, Timezone={timezone_id}, Geo={lat},{lng}")
        try:
            await page.goto("https://justjoin.it/job-offers")
            await page.wait_for_timeout(5000)
            
            salary_elements = await page.locator("span").all()
            found_currencies = set()
            
            count = 0
            for span in salary_elements:
                text = await span.inner_text()
                for curr in ["EUR", "PLN", "USD"]:
                    if curr in text:
                        found_currencies.add(curr)
                
                if len(found_currencies) > 0 and count > 20: 
                     break
                
                if any(char.isdigit() for char in text) and any(curr in text for curr in ["EUR", "PLN", "USD"]):
                     count += 1

            print(f"Found currencies: {found_currencies}")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

async def main():
    print("--- Simulating Germany ---")
    await check_currency('de-DE', 'Europe/Berlin', 52.5200, 13.4050)
    
    print("\n--- Simulating US ---")
    await check_currency('en-US', 'America/New_York', 40.7128, -74.0060)

    print("\n--- Simulating Germany but with PL Locale ---")
    await check_currency('pl-PL', 'Europe/Berlin', 52.5200, 13.4050)

if __name__ == "__main__":
    asyncio.run(main())
