import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.database import init_db_pool, get_db_pool, close_db_pool

async def run_migration():
    await init_db_pool()
    pool = get_db_pool()
    async with pool.acquire() as conn:
        try:
            print("Applying migration...")
            await conn.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT;")
            print("SUCCESS: Migration applied successfully.")
        except Exception as e:
            print(f"DB Error: {e}")
    await close_db_pool()

if __name__ == "__main__":
    asyncio.run(run_migration())
