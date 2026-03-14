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
    conn = await asyncpg.connect(dsn)
        
    print("=== User UUIDs ===")
    r1 = await conn.fetch("SELECT id, email FROM users LIMIT 10")
    for r in r1: print(dict(r))
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
