import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()

async def main():
    user = os.getenv("AWS_DB_USERNAME")
    password = os.getenv("AWS_DB_PASSWORD")
    host = os.getenv("AWS_DB_ENDPOINT")
    dbname = os.getenv("AWS_DB_NAME")
    
    dsn = f"postgres://{user}:{password}@{host}:5432/{dbname}?sslmode=require"
    
    try:
        conn = await asyncpg.connect(dsn)
        count = await conn.fetchval("SELECT COUNT(*) FROM offer_skills")
        print(f"Total rows in offer_skills: {count}")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
