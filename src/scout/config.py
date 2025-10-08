# config.py
"""
Configuration constants for Scout.
This module contains all configurable parameters used throughout the scraping process.
"""

class ScrapingConfig:
    """Configuration constants for scraping behavior."""
    
    # Browser configuration
    HEADLESS = True
    RESTART_BROWSER_EVERY = 500  # Restart browser every N offers for memory cleanup
    
    # Scraping limits
    SCROLL_PAUSE_TIME = 0.05
    MAX_IDLE_SCROLLS = 100
    
    # Timeouts
    LINK_TIMEOUT = 2000  # 2 seconds
    PAGE_LOAD_TIMEOUT = 60000  # 60 seconds
    REQUEST_DELAY = 0.5  # 0.5 seconds between requests
