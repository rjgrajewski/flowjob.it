import asyncio
import os
import sys

# Setup environment to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.database import init_db_pool, get_db_pool, close_db_pool

async def check_db():
    await init_db_pool()
    pool = get_db_pool()
    async with pool.acquire() as conn:
        try:
            # Check columns in user_profiles
            rows = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'")
            columns = [r['column_name'] for r in rows]
            print("Columns in user_profiles:", columns)
            if 'profile_picture' in columns:
                print("SUCCESS: profile_picture column exists.")
            else:
                print("ERROR: profile_picture column is MISSING.")
        except Exception as e:
            print(f"DB Error: {e}")
    await close_db_pool()

if __name__ == "__main__":
    asyncio.run(check_db())
