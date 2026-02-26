"""Run migration 007: add show_on_cv to user_skills. From repo root: python3 backend/run_show_on_cv_migration.py"""
import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import get_db_pool, init_db_pool, close_db_pool

async def run_migration():
    await init_db_pool()
    pool = get_db_pool()
    migration_file = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../src/sql/migrations/007_show_on_cv.sql")
    )
    with open(migration_file, "r") as f:
        sql = f.read()
    print(f"Executing migration from {migration_file}...")
    async with pool.acquire() as conn:
        await conn.execute(sql)
    print("Migration successful!")
    await close_db_pool()

if __name__ == "__main__":
    asyncio.run(run_migration())
