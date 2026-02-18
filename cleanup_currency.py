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
        print("Cleaning up EUR offers...")
        result = await conn.execute("""
            DELETE FROM offers 
            WHERE salary_any LIKE '%EUR%' 
               OR salary_b2b LIKE '%EUR%' 
               OR salary_internship LIKE '%EUR%' 
               OR salary_mandate LIKE '%EUR%' 
               OR salary_permanent LIKE '%EUR%' 
               OR salary_specific_task LIKE '%EUR%'
        """)
        print(f"Cleanup result: {result}")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
