
import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import get_db_pool, init_db_pool, close_db_pool

async def run_migration():
    await init_db_pool()
    pool = get_db_pool()
    
    migration_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/sql/migrations/005_user_onboarding.sql'))
    
    with open(migration_file, 'r') as f:
        sql = f.read()
        
    print(f"Executing migration from {migration_file}...")
    
    async with pool.acquire() as conn:
        async with conn.transaction():
            # asyncpg execute can run multiple statements separated by semicolon
            await conn.execute(sql)
            
    print("Migration successful!")
    await close_db_pool()

if __name__ == "__main__":
    asyncio.run(run_migration())
