import logging
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_db_pool: asyncpg.Pool = None

async def init_db_pool():
    global _db_pool
    secret_arn = os.getenv("SECRET_ARN")
    if secret_arn:
        if not os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_BEDROCK_ACCESS_KEY"):
            os.environ["AWS_ACCESS_KEY_ID"] = os.getenv("AWS_BEDROCK_ACCESS_KEY")
        if not os.getenv("AWS_SECRET_ACCESS_KEY") and os.getenv("AWS_BEDROCK_SECRET_ACCESS_KEY"):
            os.environ["AWS_SECRET_ACCESS_KEY"] = os.getenv("AWS_BEDROCK_SECRET_ACCESS_KEY")

        try:
            import sys
            sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
            from src.scout.aws_secrets import setup_database_credentials_from_secrets
            setup_database_credentials_from_secrets(secret_arn)
        except Exception as e:
            logger.error("Failed to load secrets from AWS: %s", e)

    user = os.getenv("AWS_DB_USERNAME")
    password = os.getenv("AWS_DB_PASSWORD")
    host = os.getenv("AWS_DB_ENDPOINT")
    dbname = os.getenv("AWS_DB_NAME")
    
    if not all([user, password, host, dbname]):
        raise ValueError("Database credentials missing in .env file and AWS Secrets failed")
        
    import urllib.parse
    encoded_password = urllib.parse.quote_plus(password)
    dsn = f"postgres://{user}:{encoded_password}@{host}:5432/{dbname}?sslmode=require"
    _db_pool = await asyncpg.create_pool(dsn, min_size=1, max_size=10)

async def close_db_pool():
    global _db_pool
    if _db_pool:
        await _db_pool.close()

def get_db_pool() -> asyncpg.Pool:
    if not _db_pool:
        raise Exception("Database pool is not initialized")
    return _db_pool
