"""
Configuration management module for loading and validating environment variables.
"""

import os
from typing import Optional
from dotenv import load_dotenv

from .models import EnvironmentConfig, DatabaseConfig, ScraperConfig


def load_and_validate_config(config_path: Optional[str] = None) -> EnvironmentConfig:
    """
    Load and validate all environment variables.
    
    Args:
        config_path: Optional path to .env file
        
    Returns:
        EnvironmentConfig: Validated configuration object
        
    Raises:
        ValueError: If required environment variables are missing or invalid
    """
    # Load environment variables from .env file (override=True to use .env values for testing)
    if config_path:
        load_dotenv(config_path, override=True)
    else:
        load_dotenv(override=True)
    
    try:
        # Build database configuration
        database_config = DatabaseConfig(
            database_url=os.getenv("DATABASE_URL"),
            db_user=os.getenv("DB_USER", "aligno"),
            db_password=os.getenv("DB_PASSWORD"),
            db_host=os.getenv("DB_HOST", "localhost"),
            db_port=int(os.getenv("DB_PORT", "5432")),
            db_name=os.getenv("DB_NAME", "aligno_db")
        )
        
        
        # Build scraper configuration
        max_offers = os.getenv("MAX_OFFERS")
        scraper_config = ScraperConfig(
            headless=os.getenv("HEADLESS", "true").lower() in ("true", "1", "yes"),
            batch_size=int(os.getenv("BATCH_SIZE", "500")),
            scroll_pause=float(os.getenv("SCROLL_PAUSE", "0.512")),
            max_idle=int(os.getenv("MAX_IDLE", "5")),
            timeout=int(os.getenv("SCRAPER_TIMEOUT", "30000")),
            max_offers=int(max_offers) if max_offers else None
        )
        
        # Build complete configuration
        config = EnvironmentConfig(
            database=database_config,
            scraper=scraper_config
        )
        
        return config
        
    except Exception as e:
        # Provide helpful error message with missing variables
        missing_vars = []
        
        if not os.getenv("DATABASE_URL") and not os.getenv("DB_PASSWORD"):
            missing_vars.extend(["DATABASE_URL or DB_PASSWORD"])
        
        error_msg = f"Configuration validation failed: {e}"
        if missing_vars:
            error_msg += f"\n\nRequired environment variables:\n"
            for var in missing_vars:
                error_msg += f"- {var} (required)\n"
            
            error_msg += "\nOptional environment variables:\n"
            error_msg += "- HEADLESS (default: true)\n"
            error_msg += "- BATCH_SIZE (default: 500)\n"
            error_msg += "- SCROLL_PAUSE (default: 0.512)\n"
            error_msg += "- MAX_IDLE (default: 5)\n"
            error_msg += "- SCRAPER_TIMEOUT (default: 30000)\n"
            error_msg += "- MAX_OFFERS (default: None - no limit)\n"
            
            if not os.getenv("DATABASE_URL"):
                error_msg += "\nDatabase configuration:\n"
                error_msg += "- DATABASE_URL (recommended)\n"
                error_msg += "  OR individual DB settings:\n"
                error_msg += "  - DB_USER (default: aligno)\n"
                error_msg += "  - DB_PASSWORD (required if not using DATABASE_URL)\n"
                error_msg += "  - DB_HOST (default: localhost)\n"
                error_msg += "  - DB_PORT (default: 5432)\n"
                error_msg += "  - DB_NAME (default: aligno_db)\n"
        
        raise ValueError(error_msg)


def validate_environment_on_startup() -> EnvironmentConfig:
    """
    Validate environment variables on application startup.
    
    Returns:
        EnvironmentConfig: Validated configuration object
        
    Raises:
        ValueError: If validation fails
    """
    try:
        config = load_and_validate_config()
        print("✅ Environment validation passed")
        return config
    except ValueError as e:
        print(f"❌ Environment validation failed: {e}")
        raise


def get_database_dsn(database_config: DatabaseConfig) -> str:
    """
    Get database DSN string from configuration.
    
    Args:
        database_config: Database configuration object
        
    Returns:
        str: Database DSN string
    """
    if database_config.database_url:
        return database_config.database_url
    
    return f"postgresql://{database_config.db_user}:{database_config.db_password}@{database_config.db_host}:{database_config.db_port}/{database_config.db_name}"


def validate_database_credentials(database_config: DatabaseConfig) -> None:
    """
    Validate database credentials are provided.
    
    Args:
        database_config: Database configuration object
        
    Raises:
        ValueError: If database credentials are missing
    """
    if not database_config.database_url and not database_config.db_password:
        raise ValueError("Database credentials missing: provide either DATABASE_URL or DB_PASSWORD")
