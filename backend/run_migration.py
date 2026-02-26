#!/usr/bin/env python3
"""
Generic migration runner. Usage from repo root:
    python3 backend/run_migration.py src/sql/migrations/005_user_onboarding.sql
    python3 backend/run_migration.py src/sql/migrations/007_show_on_cv.sql
    python3 backend/run_migration.py src/sql/migrations/008_data_processing_clause.sql
"""
import asyncio
import logging
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import init_db_pool, get_db_pool, close_db_pool

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


async def run_migration(migration_path: str):
    if not os.path.isfile(migration_path):
        logger.error("Migration file not found: %s", migration_path)
        sys.exit(1)

    with open(migration_path, "r") as f:
        sql = f.read()

    await init_db_pool()
    pool = get_db_pool()
    logger.info("Executing migration: %s", migration_path)
    try:
        async with pool.acquire() as conn:
            await conn.execute(sql)
        logger.info("Migration successful: %s", migration_path)
    except Exception as e:
        logger.error("Migration failed: %s", e)
        sys.exit(1)
    finally:
        await close_db_pool()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("Usage: python3 backend/run_migration.py <path_to_sql_file>")
        sys.exit(1)
    asyncio.run(run_migration(sys.argv[1]))
