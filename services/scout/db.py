# db.py

import asyncpg, logging, os
from pathlib import Path
from urllib.parse import quote_plus

import json
import boto3

def get_database_dsn() -> str:
    """Get database DSN from environment variables for AWS RDS or DATABASE_URL."""
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        if 'sslmode=' not in database_url:
            separator = '&' if '?' in database_url else '?'
            database_url += f"{separator}sslmode=require"
        return database_url
    
    # AWS RDS configuration
    aws_endpoint = os.getenv('AWS_DB_ENDPOINT')
    aws_db_name = os.getenv('AWS_DB_NAME')
    aws_username = os.getenv('AWS_DB_USERNAME')
    aws_password = os.getenv('AWS_DB_PASSWORD')
    
    # Attempt to load credentials from AWS Secrets Manager
    secret_arn = os.getenv('SECRET_ARN')
    if secret_arn:
        try:
            logging.info(f"Fetching credentials from Secrets Manager: {secret_arn}")
            session = boto3.Session(
                aws_access_key_id=os.getenv('AWS_BEDROCK_ACCESS_KEY') or os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_BEDROCK_SECRET_ACCESS_KEY') or os.getenv('AWS_SECRET_ACCESS_KEY'),
                region_name=os.getenv('AWS_REGION', 'eu-central-1')
            )
            client = session.client(service_name='secretsmanager')
            response = client.get_secret_value(SecretId=secret_arn)
            if 'SecretString' in response:
                secret = json.loads(response['SecretString'])
                aws_username = secret.get('username', aws_username)
                aws_password = secret.get('password', aws_password)
                aws_endpoint = secret.get('host', aws_endpoint)
                aws_db_name = secret.get('dbname', aws_db_name)
        except Exception as e:
            logging.error(f"Failed to retrieve secret from Secrets Manager: {e}")
    
    if not all([aws_endpoint, aws_username, aws_password, aws_db_name]):
        raise ValueError("Missing AWS configuration. Please set SECRET_ARN, or AWS_DB_ENDPOINT, AWS_DB_USERNAME, AWS_DB_PASSWORD, and AWS_DB_NAME.")
    
    # URL-encode username and password to handle special characters
    username_encoded = quote_plus(aws_username or '')
    password_encoded = quote_plus(aws_password or '')
    
    logging.info(f"Connecting to AWS RDS: {aws_endpoint}")
    return f"postgresql://{username_encoded}:{password_encoded}@{aws_endpoint}:5432/{aws_db_name}?sslmode=require"


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
    except asyncpg.exceptions.InvalidCatalogNameError as e:
        aws_endpoint = os.getenv('AWS_DB_ENDPOINT')
        aws_db_name = os.getenv('AWS_DB_NAME')
        logging.error(f"❌ InvalidCatalogNameError: {e}")
        logging.error(f"❌ Trying to connect to database: '{aws_db_name}' on endpoint: {aws_endpoint}")
        raise Exception(f"❌ Database '{aws_db_name}' not found on AWS RDS endpoint: {aws_endpoint}. Please create the database manually in AWS console.")
    except Exception as e:
        logging.error(f"❌ Connection error: {e}")
        raise Exception(f"❌ Failed to connect to database: {e}")

    # Ensure the offers table exists
    project_root = Path(__file__).resolve().parent.parent.parent
    schema_path = project_root / "backend" / "sql" / "tables" / "offers.sql"
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


async def purge_stale_offers(conn: asyncpg.Connection, current_urls: set[str]):
    """
    Remove offers that are no longer present on the website.

    Args:
        conn: Database connection.
        current_urls: Set of URLs currently present on the website.
    """
    if not current_urls:
        logging.info("🗑️ No current URLs provided, skipping stale offers cleanup")
        return

    # Count offers before deletion
    total_offers_before = await conn.fetchval("SELECT COUNT(*) FROM offers")
    
    # Convert set to list for SQL IN clause
    current_urls_list = list(current_urls)
    
    # Use PostgreSQL's ANY operator for better performance
    delete_query = """
        DELETE FROM offers 
        WHERE job_url != ALL($1::text[])
    """

    try:
        result = await conn.execute(delete_query, current_urls_list)
        # Extract number of deleted rows from result string
        deleted_count = int(result.split()[-1]) if result and result.split()[-1].isdigit() else 0
        
        logging.info(f"🗑️ Purged {deleted_count} stale offers")
        logging.info(f"📊 Database sync: {total_offers_before} → {total_offers_before - deleted_count} offers")
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
        AND work_schedule IS NULL 
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