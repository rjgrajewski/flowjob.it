# db.py

import asyncpg, logging, os
from pathlib import Path
from typing import Iterable, Sequence

def get_database_dsn():
    """Get database DSN from environment variables for AWS RDS or DATABASE_URL."""
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        return database_url
    
    # AWS RDS configuration
    aws_endpoint = os.getenv('AWS_DB_ENDPOINT')
    aws_username = os.getenv('AWS_DB_USERNAME')
    aws_password = os.getenv('AWS_DB_PASSWORD')
    aws_db_name = os.getenv('AWS_DB_NAME')
    
    if not all([aws_endpoint, aws_username, aws_password, aws_db_name]):
        raise ValueError("Missing AWS RDS configuration. Please set AWS_DB_ENDPOINT, AWS_DB_USERNAME, AWS_DB_PASSWORD, and AWS_DB_NAME environment variables.")
    
    logging.info(f"Connecting to AWS RDS: {aws_endpoint}")
    return f"postgresql://{aws_username}:{aws_password}@{aws_endpoint}:5432/{aws_db_name}"


async def init_db_connection() -> asyncpg.Connection:
    """
    Initializes and returns an asyncpg database connection to AWS RDS.

    - Connects to a PostgreSQL database using AWS RDS configuration.
    - Ensures the 'offers' table exists with the required schema.

    Returns:
        asyncpg.Connection: An open connection to the database.
    """
    # Get database DSN
    dsn = get_database_dsn()
    
    try:
        conn = await asyncpg.connect(dsn=dsn, command_timeout=60)
        logging.info("✅ Database connection established successfully")
    except asyncpg.exceptions.InvalidCatalogNameError:
        aws_endpoint = os.getenv('AWS_DB_ENDPOINT')
        raise Exception(f"❌ Database not found on AWS RDS endpoint: {aws_endpoint}. Please create the database manually in AWS console.")
    except Exception as e:
        raise Exception(f"❌ Failed to connect to database: {e}")

    # Ensure the offers table exists
    schema_path = Path(__file__).parent.parent / "sql" / "tables" / "offers.sql"
    if schema_path.exists():
        ddl = schema_path.read_text()
        await conn.execute(ddl)
        logging.info("✅ Database schema initialized")
    else:
        logging.warning(f"⚠️ Schema file not found: {schema_path}")
    
    return conn

async def check_connection(conn: asyncpg.Connection) -> bool:
    """
    Check if the database connection is still alive.

    Args:
        conn: The database connection to check.

    Returns:
        bool: True if the connection is alive, False otherwise.
    """
    try:
        await conn.fetchval('SELECT 1')
        return True
    except Exception:
        return False

async def reconnect_db() -> asyncpg.Connection:
    """
    Reconnect to the database.

    Returns:
        asyncpg.Connection: A new database connection.
    """
    logging.info("🔄 Reconnecting to database...")
    return await init_db_connection()

async def insert_offers(conn: asyncpg.Connection, offers: Iterable[Sequence]):
    """
    Insert multiple job offers into the database.

    Args:
        conn: Database connection.
        offers: Iterable of offer data tuples.
    """
    if not offers:
        return

    insert_query = """
        INSERT INTO offers (
            job_url, job_title, category, company, location,
            salary_any, salary_b2b, salary_internship, salary_mandate,
            salary_permanent, salary_specific_task, work_type, experience,
            employment_type, operating_mode, tech_stack
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (job_url) DO NOTHING
    """

    try:
        await conn.executemany(insert_query, offers)
    except Exception as e:
        logging.error(f"❌ Error inserting offers: {e}")
        raise

async def purge_stale_offers(conn: asyncpg.Connection, current_urls: set[str]):
    """
    Remove offers that are no longer present on the website.

    Args:
        conn: Database connection.
        current_urls: Set of URLs currently present on the website.
    """
    if not current_urls:
        return

    # Convert set to list for SQL IN clause
    current_urls_list = list(current_urls)
    
    # Use PostgreSQL's ANY operator for better performance
    delete_query = """
        DELETE FROM offers 
        WHERE job_url != ALL($1::text[])
    """

    try:
        result = await conn.execute(delete_query, current_urls_list)
        logging.info(f"🗑️ Purged stale offers: {result}")
    except Exception as e:
        logging.error(f"❌ Error purging stale offers: {e}")
        raise

async def cleanup_empty_offers(conn: asyncpg.Connection):
    """
    Remove offers that have only job_url but all other fields are NULL.
    These are typically offers that failed during data extraction.

    Args:
        conn: Database connection.
    """
    cleanup_query = """
        DELETE FROM offers 
        WHERE job_url IS NOT NULL 
        AND job_title IS NULL 
        AND category IS NULL 
        AND company IS NULL 
        AND location IS NULL 
        AND salary_any IS NULL 
        AND salary_b2b IS NULL 
        AND salary_internship IS NULL 
        AND salary_mandate IS NULL 
        AND salary_permanent IS NULL 
        AND salary_specific_task IS NULL 
        AND work_type IS NULL 
        AND experience IS NULL 
        AND employment_type IS NULL 
        AND operating_mode IS NULL 
        AND tech_stack IS NULL
    """

    try:
        result = await conn.execute(cleanup_query)
        logging.info(f"🧹 Cleaned up empty offers: {result}")
    except Exception as e:
        logging.error(f"❌ Error cleaning up empty offers: {e}")
        raise