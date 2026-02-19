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
    
    dsn = f"postgres://{user}:{password}@{host}:5432/{dbname}"
    print(f"Connecting to {dsn.replace(password, '******')}...")
    
    try:
        conn = await asyncpg.connect(dsn)
        print("Connected!")
        
        # Fetch skills with usage count, grouped by normalized name
        query = """
            SELECT 
                MAX(s.uuid) as id, 
                COALESCE(s.canonical_skill_name, s.original_skill_name) as name, 
                MAX(s.category) as category,
                COUNT(os.job_url) as frequency
            FROM skills s
            LEFT JOIN offer_skills os ON s.uuid = os.skill_id
            GROUP BY COALESCE(s.canonical_skill_name, s.original_skill_name)
            ORDER BY frequency DESC, name ASC
        """
        print("Running aggregation query...")
        rows = await conn.fetch(query)
        print(f"Query successful! Got {len(rows)} rows.")
        if rows:
            print("Sample row:", rows[0])
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
