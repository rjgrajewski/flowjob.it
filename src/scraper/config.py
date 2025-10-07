# config.py
"""
Configuration constants for the scraper.
This module contains all configurable parameters used throughout the scraping process.
"""


class ScrapingConfig:
    """Configuration constants for scraping behavior."""
    
    # Scraping limits
    SCROLL_PAUSE_TIME = 0.05
    MAX_IDLE_SCROLLS = 100
    
    # Timeouts
    LINK_TIMEOUT = 2000  # 2 seconds
    PAGE_LOAD_TIMEOUT = 10000  # 10 seconds
    REQUEST_DELAY = 0.5  # 0.5 seconds between requests
