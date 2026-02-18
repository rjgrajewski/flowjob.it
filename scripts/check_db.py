import asyncio
import os
import sys
from dotenv import load_dotenv

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from scout.db import init_db_connection

async def main():
    load_dotenv()
    try:
        conn = await init_db_connection()
        rows = await conn.fetch("SELECT salary_any, salary_b2b, salary_permanent FROM offers LIMIT 10")
        print(f"Found {len(rows)} rows.")
        for row in rows:
            print(f"Any: {row['salary_any']}, B2B: {row['salary_b2b']}, Perm: {row['salary_permanent']}")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
