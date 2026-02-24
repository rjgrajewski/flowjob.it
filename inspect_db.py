
import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def inspect_users_table():
    user = os.getenv("AWS_DB_USERNAME")
    password = os.getenv("AWS_DB_PASSWORD")
    if password.startswith("'") and password.endswith("'"):
        password = password[1:-1]
    host = os.getenv("AWS_DB_ENDPOINT")
    dbname = os.getenv("AWS_DB_NAME")
    
    import urllib.parse
    encoded_password = urllib.parse.quote_plus(password)
    dsn = f"postgres://{user}:{encoded_password}@{host}:5432/{dbname}?sslmode=require"
    
    conn = await asyncpg.connect(dsn)
    try:
        columns = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        """)
        for col in columns:
            print(f"{col['column_name']}: {col['data_type']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(inspect_users_table())
