import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def run():
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    rows = await conn.fetch("SELECT COUNT(*) FROM offer_skills")
    print("offer_skills count:", rows[0][0])
    rows = await conn.fetch("SELECT * FROM offer_skills LIMIT 1")
    print("offer_skills sample:", rows)
    rows = await conn.fetch("SELECT COUNT(*) FROM skills")
    print("skills count:", rows[0][0])
    
    q = """
            SELECT 
                MAX(s.uuid::text) as id, 
                COALESCE(s.canonical_skill_name, s.original_skill_name) as name, 
                COUNT(os.job_url) as frequency
            FROM skills s
            LEFT JOIN offer_skills os ON s.uuid = os.skill_id
            GROUP BY COALESCE(s.canonical_skill_name, s.original_skill_name)
            ORDER BY frequency DESC, name ASC
            LIMIT 5
"""
    rows = await conn.fetch(q)
    print("Top skills by freq:", rows)
    await conn.close()

asyncio.run(run())
