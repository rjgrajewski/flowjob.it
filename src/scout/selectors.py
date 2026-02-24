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
    fallback: str = ""


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

    JOB_DESCRIPTION = SelectorConfig(
        primary=':is(h1, h2, h3, h4, h5, h6):has-text("Job description") + div',
        fallback='xpath=//*[contains(translate(text(), "JOB DESCRIPTION", "job description"), "job description")]/following-sibling::div[1]',
        description="Full job description container"
    )
    
    CATEGORY_PILL = SelectorConfig(
        primary='h1 + div', # Sibling of Job Title
        description="Category pill in header (Red frame)"
    )

    CATEGORY_BREADCRUMB = SelectorConfig(
        primary='a[href*="/job-offers/all-locations/"]:not([href="/job-offers/all-locations"])',
        description="Job category from breadcrumbs (Yellow frame)"
    )
    
    COMPANY = SelectorConfig(
        primary='a[href*="companies="] h2',
        description="Company name from link to company profile"
    )

    # Info Grid Selectors (using unique icons)
    LOCATION = SelectorConfig(
        primary='div:has(> svg) + div:has-text(",")', 
        fallback='a[href="/job-offers/all-locations"] >> nth=2',
        description="Location from header icon sibling with comma"
    )
    
    WORK_SCHEDULE = SelectorConfig(
        primary='.MuiStack-root:has(> .MuiStack-root > svg path[d^="M21 19C21 19.552"])', # Suitcase Icon
        description="Work schedule (Full-time, etc.)"
    )
    
    EMPLOYMENT_TYPE = SelectorConfig(
        primary='.MuiStack-root:has(> .MuiStack-root > svg path[d^="M6 22.625"])', # Document Icon
        description="Employment type (B2B, Permanent, etc.)"
    )
    
    EXPERIENCE = SelectorConfig(
        primary='.MuiStack-root:has(> .MuiStack-root > svg[data-testid="SchoolOutlinedIcon"])', # School Icon
        description="Experience level (Junior, Mid, Senior)"
    )
    
    OPERATING_MODE = SelectorConfig(
        primary='.MuiStack-root:has(> .MuiStack-root > svg path[d^="M16.065 24.2315"])', # Globe/Network Icon
        description="Operating mode (Remote, Hybrid, Office)"
    )
    

    
    SALARY_SPANS = SelectorConfig(
        primary='span:has-text(" per ")',
        description="Spans containing salary information with 'per' text"
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