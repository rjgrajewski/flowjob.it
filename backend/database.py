import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

async def get_db_connection():
    # Construct the DSN from environment variables
    # Expected format: postgres://user:password@host:port/database
    
    user = os.getenv("AWS_DB_USERNAME")
    password = os.getenv("AWS_DB_PASSWORD")
    host = os.getenv("AWS_DB_ENDPOINT")
    dbname = os.getenv("AWS_DB_NAME")
    
    if not all([user, password, host, dbname]):
        raise ValueError("Database credentials missing in .env file")
        
    dsn = f"postgres://{user}:{password}@{host}:5432/{dbname}"
    
    return await asyncpg.connect(dsn)
