#!/usr/bin/env python3
"""
Check if user_skills table exists and is usable. Run from repo root:
  python3 backend/check_user_skills_table.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database import init_db_pool, get_db_pool, close_db_pool


async def main():
    await init_db_pool()
    pool = get_db_pool()
    async with pool.acquire() as conn:
        # Does user_skills exist?
        exists = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'user_skills'
            )
            """
        )
        if not exists:
            print("ERROR: Table user_skills does not exist.")
            print("Run: python3 backend/migration_user_skills.py  (then run 007_show_on_cv.sql for show_on_cv)")
            return

        # Columns
        cols = await conn.fetch(
            """
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'user_skills'
            ORDER BY ordinal_position
            """
        )
        print("Table user_skills columns:", [f"{r['column_name']}({r['data_type']})" for r in cols])

        has_show_on_cv = any(r["column_name"] == "show_on_cv" for r in cols)
        if not has_show_on_cv:
            print("WARNING: Column show_on_cv missing. Run: src/sql/migrations/007_show_on_cv.sql")

        # users.id type (must match user_skills.user_id)
        users_id_type = await conn.fetchval(
            """
            SELECT data_type FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
            """
        )
        user_skills_user_id_type = await conn.fetchval(
            """
            SELECT data_type FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'user_skills' AND column_name = 'user_id'
            """
        )
        print(f"users.id type: {users_id_type}, user_skills.user_id type: {user_skills_user_id_type}")
        if users_id_type != user_skills_user_id_type:
            print("WARNING: users.id and user_skills.user_id types differ – INSERT may fail.")

        # Row count
        n = await conn.fetchval("SELECT COUNT(*) FROM user_skills")
        print(f"Current rows in user_skills: {n}")

    await close_db_pool()
    print("OK: user_skills table is present and consistent.")


if __name__ == "__main__":
    asyncio.run(main())
