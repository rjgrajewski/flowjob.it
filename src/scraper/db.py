# db.py

import asyncpg, logging, os
from dotenv import load_dotenv
from pathlib import Path
from typing import Iterable, Sequence

try:
    from ..validation.config import get_database_dsn, validate_database_credentials
    from ..validation.validators import validate_database_name
except ImportError:
    # Fallback for direct execution
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from validation.config import get_database_dsn, validate_database_credentials
    from validation.validators import validate_database_name


# Load environment variables from .env file
load_dotenv()

# Set up logging configuration
logging.basicConfig(level=logging.INFO)

async def init_db_connection() -> asyncpg.Connection:
    """
    Initializes and returns an asyncpg database connection.

    - Connects to a PostgreSQL database using environment variables or user input.
    - If the database does not exist, it is created.
    - Ensures the 'offers' table exists with the required schema.

    Returns:
        asyncpg.Connection: An open connection to the database.
    """
    try:
        from ..validation.config import load_and_validate_config
    except ImportError:
        from validation.config import load_and_validate_config
    
    # Load and validate configuration
    config = load_and_validate_config()
    validate_database_credentials(config.database)
    
    dsn = get_database_dsn(config.database)
    
    try:
        conn = await asyncpg.connect(dsn=dsn, command_timeout=60)
    except asyncpg.exceptions.InvalidCatalogNameError:
        # Create the database if it doesn't exist
        db_config = config.database
        validate_database_name(db_config.db_name)  # Validate database name before use
        
        temp_dsn = f"postgresql://{db_config.db_user}:{db_config.db_password}@{db_config.db_host}:{db_config.db_port}/postgres"
        temp_conn = await asyncpg.connect(dsn=temp_dsn)
        await temp_conn.execute(f'CREATE DATABASE "{db_config.db_name}"')  # Use quoted identifier
        await temp_conn.close()
        conn = await asyncpg.connect(dsn=dsn, command_timeout=60)

    schema_path = Path(__file__).parent.parent / "sql" / "01_offers.sql"
    ddl = schema_path.read_text()
    await conn.execute(ddl)
    return conn

async def check_connection(conn: asyncpg.Connection) -> bool:
    """
    Check if the database connection is still alive.
    
    Returns:
        bool: True if connection is alive, False otherwise.
    """
    try:
        await conn.fetchval("SELECT 1")
        return True
    except Exception:
        return False

async def reconnect_db(conn: asyncpg.Connection) -> asyncpg.Connection:
    """
    Reconnect to the database if the connection is lost.
    
    Args:
        conn: The old connection (will be closed)
        
    Returns:
        asyncpg.Connection: A new database connection.
    """
    try:
        await conn.close()
    except Exception:
        pass  # Connection might already be closed
    
    return await init_db_connection()

async def insert_offers(
    conn: asyncpg.Connection, 
    rows: Iterable[Sequence[str]],  # List of tuples
    current_urls: Iterable[str],    # Set of strings
    batch_size: int = 500
) -> None:
    
    """
    Inserts new job offers into the 'offers' table and removes outdated ones.

    Args:
        conn (asyncpg.Connection): The database connection.
        rows (Iterable): Iterable of offer tuples to insert.
        current_urls (Iterable): Iterable of job_url strings that should remain in the table.

    Behavior:
        - Inserts each offer into the table, ignoring duplicates (by job_url).
        - Deletes offers from the table whose job_url is not in current_urls.
    """

    try:
        row_list = list(rows)
        # Batch insert for efficiency
        for i in range(0, len(row_list), batch_size):
            batch = row_list[i:i + batch_size]
            await conn.executemany(
                """
                INSERT INTO offers (job_url, job_title, category, company, location, salary_any, salary_b2b, salary_internship, salary_mandate, salary_perm, salary_specific_task, work_type, experience, employment_type, operating_mode, tech_stack)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                ON CONFLICT (job_url) DO NOTHING
                """,
                batch
            )
        if current_urls:
            # Safeguard to ensure current_urls is not empty
            await conn.execute(
                "DELETE FROM offers WHERE job_url NOT IN (SELECT UNNEST($1::text[]));",
                list(current_urls)
            )
        logging.info("Offers updated successfully.")
    except asyncpg.exceptions.UniqueViolationError as e:
        logging.error(f"Unique violation error occurred: {e}")