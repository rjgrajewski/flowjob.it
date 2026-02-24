
import asyncio
import logging
import os
import sys
from dotenv import load_dotenv

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.scout.db import init_db_connection

logging.basicConfig(level=logging.ERROR)
load_dotenv()

async def list_offer():
    conn = await init_db_connection()
    try:
        url = "https://justjoin.it/job-offer/astek-polska-b2b---konsultant-eba-dora---praca-zdalna-m-k--gdansk-pomorskie--other"
        
        print("--- RAW DATA FROM offers TABLE ---")
        row = await conn.fetchrow("SELECT * FROM offers WHERE job_url = $1", url)
        if row:
            for key in row.keys():
                print(f"{key}: {row[key]}")
        else:
            print("Offer not found in offers table.")
            
        print("\n--- DATA FROM offers_parsed VIEW ---")
        row_parsed = await conn.fetchrow("SELECT * FROM offers_parsed WHERE job_url = $1", url)
        if row_parsed:
            for key in row_parsed.keys():
                print(f"{key}: {row_parsed[key]}")
        else:
            print("Offer not found in offers_parsed view (might be a regex mismatch).")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(list_offer())
