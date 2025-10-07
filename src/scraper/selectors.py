# selectors.py
"""
Centralized selectors configuration for web scraping.
This module contains all CSS selectors, XPath expressions, and other locators
used throughout the scraping process.
"""

from dataclasses import dataclass


@dataclass
class SelectorConfig:
    """Configuration class for selectors."""
    primary: str
    description: str = ""


class JustJoinItSelectors:
    """Centralized selectors for JustJoin.it website."""
    
    JOB_OFFER_LINKS = SelectorConfig(
        primary='a[href*="/job-offer/"]',
        description="Links to individual job offers"
    )
    
    JOB_TITLE = SelectorConfig(
        primary='h1',
        description="Main job title heading"
    )
    
    CATEGORY = SelectorConfig(
        primary='xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[2]/div[1]/div',
        description="Job category information"
    )
    
    COMPANY = SelectorConfig(
        primary='a:has(svg[data-testid="ApartmentRoundedIcon"]) p',
        description="Company name from link with apartment icon"
    )
    
    LOCATION = SelectorConfig(
        primary='xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[2]/div/div/nav/ol/li[3]/a',
        description="Job location from breadcrumb navigation"
    )
    
    SALARY_SPANS = SelectorConfig(
        primary='span:has-text(" per ")',
        description="Spans containing salary information with 'per' text"
    )
    
    WORK_TYPE = SelectorConfig(
        primary='xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[3]/div[1]/div[2]',
        description="Work type information"
    )
    
    EXPERIENCE = SelectorConfig(
        primary='xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[3]/div[3]/div[2]',
        description="Required experience level"
    )
    
    EMPLOYMENT_TYPE = SelectorConfig(
        primary='xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[3]/div[2]/div[2]',
        description="Employment type (B2B, UoP, etc.)"
    )
    
    TECH_NAMES = SelectorConfig(
        primary='h4',
        description="Technology names in tech stack section"
    )
    
    TECH_LEVELS = SelectorConfig(
        primary='span',
        description="Technology proficiency levels"
    )
    
    TECH_CONTAINERS = SelectorConfig(
        primary='div',
        description="Containers that hold tech stack items"
    )


class SelectorPatterns:
    """Regular expression patterns for text matching."""
    
    # Salary patterns
    SALARY_ANY = r'.*per.*- Any$'
    SALARY_B2B = r'.*per.*- B2B$'
    SALARY_INTERNSHIP = r'.*per.*- Internship$'
    SALARY_MANDATE = r'.*per.*- Mandate$'
    SALARY_PERMANENT = r'.*per.*- Permanent$'
    SALARY_SPECIFIC_TASK = r'.*per.*- Specific-task$'


def get_selector(selector_config: SelectorConfig) -> str:
    """
    Get the selector string from configuration.
    
    Args:
        selector_config: SelectorConfig object containing selector information
        
    Returns:
        str: The selector string to use
    """
    return selector_config.primary


# Export the main selectors class for easy importing
SELECTORS = JustJoinItSelectors()
PATTERNS = SelectorPatterns()