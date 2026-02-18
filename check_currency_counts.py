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
        total = await conn.fetchval("SELECT COUNT(*) FROM offers")
        eur_count = await conn.fetchval("SELECT COUNT(*) FROM offers WHERE salary_b2b LIKE '%EUR%' OR salary_permanent LIKE '%EUR%'")
        pln_count = await conn.fetchval("SELECT COUNT(*) FROM offers WHERE salary_b2b LIKE '%PLN%' OR salary_permanent LIKE '%PLN%'")
        
        print(f"Total offers: {total}")
        print(f"EUR offers: {eur_count}")
        print(f"PLN offers: {pln_count}")
        
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
