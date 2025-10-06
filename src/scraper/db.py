# db.py

import asyncpg, logging, os
from dotenv import load_dotenv
from pathlib import Path
from typing import Iterable, Sequence

def get_database_dsn():
    """Get database DSN from environment variables."""
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        return database_url
    
    # Check for AWS RDS configuration first
    aws_endpoint = os.getenv('AWS_DB_ENDPOINT')
    aws_username = os.getenv('AWS_DB_USERNAME')
    aws_password = os.getenv('AWS_DB_PASSWORD')
    aws_db_name = os.getenv('AWS_DB_NAME', 'aligno_db')
    
    if aws_endpoint and aws_username and aws_password:
        # Use AWS RDS
        logging.info(f"Connecting to AWS RDS: {aws_endpoint}")
        return f"postgresql://{aws_username}:{aws_password}@{aws_endpoint}:5432/{aws_db_name}"
    
    # Fallback to local configuration
    user = os.getenv('DB_USER', 'aligno')
    password = os.getenv('DB_PASSWORD')
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'aligno_db')
    
    if not password:
        raise ValueError("Either DATABASE_URL, AWS credentials, or DB_PASSWORD must be set")
    
    logging.info(f"Connecting to local database: {host}:{port}/{db_name}")
    return f"postgresql://{user}:{password}@{host}:{port}/{db_name}"

def validate_database_name(name):
    """Simple database name validation."""
    if not name or not isinstance(name, str):
        raise ValueError("Database name must be a non-empty string")
    # Basic SQL injection prevention
    if any(char in name for char in [';', '--', '/*', '*/', 'xp_', 'sp_']):
        raise ValueError("Invalid characters in database name")
    return name


# Load environment variables from .env file
load_dotenv()

# Set up logging configuration
logging.basicConfig(level=logging.INFO)

async def init_db_connection() -> asyncpg.Connection:
    """
    Initializes and returns an asyncpg database connection.

    - Connects to a PostgreSQL database using environment variables or user input.
    - For AWS RDS: assumes database already exists
    - For local: creates database if it doesn't exist.
    - Ensures the 'offers' table exists with the required schema.

    Returns:
        asyncpg.Connection: An open connection to the database.
    """
    # Get database DSN
    dsn = get_database_dsn()
    
    # Check if we're using AWS RDS
    aws_endpoint = os.getenv('AWS_DB_ENDPOINT')
    
    try:
        conn = await asyncpg.connect(dsn=dsn, command_timeout=60)
        logging.info("✅ Database connection established successfully")
    except asyncpg.exceptions.InvalidCatalogNameError:
        if aws_endpoint:
            # For AWS RDS, database must exist - we can't create it
            raise Exception(f"❌ Database not found on AWS RDS endpoint: {aws_endpoint}. Please create the database manually in AWS console.")
        else:
            # For local databases, create if it doesn't exist
            db_name = os.getenv('DB_NAME', 'aligno_db')
            validate_database_name(db_name)
            
            user = os.getenv('DB_USER', 'aligno')
            password = os.getenv('DB_PASSWORD')
            host = os.getenv('DB_HOST', 'localhost')
            port = os.getenv('DB_PORT', '5432')
            temp_dsn = f"postgresql://{user}:{password}@{host}:{port}/postgres"
            temp_conn = await asyncpg.connect(dsn=temp_dsn)
            await temp_conn.execute(f'CREATE DATABASE "{db_name}"')
            await temp_conn.close()
            conn = await asyncpg.connect(dsn=dsn, command_timeout=60)
            logging.info(f"✅ Created local database: {db_name}")

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
        logging.info(f"✅ Inserted {len(list(offers))} offers into database")
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