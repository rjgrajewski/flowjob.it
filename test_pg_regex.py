
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

async def test_pg_regex():
    conn = await init_db_connection()
    try:
        test_val = "21 055.16 PLN\nNet per day - B2B"
        regex = r'([\d\s,.]+?)(?:[\s\n]*-[ \s\n]*([\d\s,.]+))?[\s\n]*([A-Z]{3})[\s\n]*(Gross|Net)[\s\n]*per[\s\n]*(\w+)'
        
        query = """
            SELECT regexp_match($1, $2, 'i') as match
        """
        row = await conn.fetchrow(query, test_val, regex)
        print(f"Test value: {test_val!r}")
        print(f"Regex: {regex!r}")
        print(f"Match: {row['match']}")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test_pg_regex())
