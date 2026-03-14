import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "services"))
from scout.db import get_database_dsn

load_dotenv()

async def main():
    dsn = get_database_dsn()
    try:
        conn = await asyncpg.connect(dsn)
        print("Connected to DB.")
        
        # Check rows before
        val = await conn.fetchval("SELECT count(*) FROM users;")
        print(f"Users table currently has {val} rows.")
        
        # Clear the table
        await conn.execute("DELETE FROM users;")
        print("Executed DELETE FROM users;")

        # Check rows after
        val_after = await conn.fetchval("SELECT count(*) FROM users;")
        print(f"Users table now has {val_after} rows.")
        
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
