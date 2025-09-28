"""
Custom validators and helper functions for data validation.
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import ValidationError
import logging
from .models import JobOfferData

logger = logging.getLogger(__name__)


def validate_job_offer_data(data: Dict[str, Any]) -> JobOfferData:
    """
    Validate job offer data using Pydantic model.
    
    Args:
        data: Raw job offer data dictionary
        
    Returns:
        JobOfferData: Validated job offer data
        
    Raises:
        ValueError: If validation fails
    """
    try:
        return JobOfferData(**data)
    except ValidationError as e:
        logger.error(f"Job offer validation failed: {e}")
        raise ValueError(f"Invalid job offer data: {e}") from e




def sanitize_string(value: Optional[str], max_length: Optional[int] = None) -> Optional[str]:
    """
    Sanitize string values by removing dangerous characters and limiting length.
    
    Args:
        value: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Optional[str]: Sanitized string or None
    """
    if value is None:
        return None
    
    # Remove control characters and normalize whitespace
    sanitized = "".join(char for char in value if ord(char) >= 32 or char in "\t\n\r")
    sanitized = " ".join(sanitized.split())
    
    # Limit length if specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length].rstrip()
    
    return sanitized if sanitized else None


def validate_database_name(name: str) -> str:
    """
    Validate database name to prevent SQL injection.
    
    Args:
        name: Database name to validate
        
    Returns:
        str: Validated database name
        
    Raises:
        ValueError: If name is invalid
    """
    import re
    
    if not name or not name.strip():
        raise ValueError("Database name cannot be empty")
    
    # Only allow alphanumeric characters and underscore
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name.strip()):
        raise ValueError("Database name can only contain alphanumeric characters and underscore, and must start with letter or underscore")
    
    return name.strip()


def validate_url(url: str) -> str:
    """
    Validate URL format.
    
    Args:
        url: URL to validate
        
    Returns:
        str: Validated URL
        
    Raises:
        ValueError: If URL is invalid
    """
    if not url or not url.strip():
        raise ValueError("URL cannot be empty")
    
    url = url.strip()
    
    # Basic URL validation
    if not url.startswith(('http://', 'https://')):
        raise ValueError("URL must start with http:// or https://")
    
    if len(url) > 2048:
        raise ValueError("URL too long (max 2048 characters)")
    
    return url


def validate_batch_size(size: Union[int, str]) -> int:
    """
    Validate batch size parameter.
    
    Args:
        size: Batch size as int or string
        
    Returns:
        int: Validated batch size
        
    Raises:
        ValueError: If batch size is invalid
    """
    try:
        if isinstance(size, str):
            size = int(size)
        
        if not isinstance(size, int):
            raise ValueError("Batch size must be an integer")
        
        if size < 1:
            raise ValueError("Batch size must be at least 1")
        
        if size > 10000:
            raise ValueError("Batch size cannot exceed 10000")
        
        return size
        
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid batch size: {e}") from e


def safe_convert_to_int(value: Any, default: int = 0, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
    """
    Safely convert value to integer with validation.
    
    Args:
        value: Value to convert
        default: Default value if conversion fails
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        
    Returns:
        int: Converted and validated integer
    """
    try:
        if value is None:
            return default
        
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return default
            result = int(float(value))  # Handle "123.0" strings
        else:
            result = int(value)
        
        if min_val is not None and result < min_val:
            return max(min_val, default)
        
        if max_val is not None and result > max_val:
            return min(max_val, default)
        
        return result
        
    except (ValueError, TypeError):
        return default


def safe_convert_to_float(value: Any, default: float = 0.0, min_val: Optional[float] = None, max_val: Optional[float] = None) -> float:
    """
    Safely convert value to float with validation.
    
    Args:
        value: Value to convert
        default: Default value if conversion fails
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        
    Returns:
        float: Converted and validated float
    """
    try:
        if value is None:
            return default
        
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return default
            result = float(value)
        else:
            result = float(value)
        
        if min_val is not None and result < min_val:
            return max(min_val, default)
        
        if max_val is not None and result > max_val:
            return min(max_val, default)
        
        return result
        
    except (ValueError, TypeError):
        return default


def validate_tech_stack_format(tech_stack: str) -> Dict[str, str]:
    """
    Parse and validate tech stack format.
    
    Args:
        tech_stack: Tech stack string in format "skill1: desc1; skill2: desc2"
        
    Returns:
        Dict[str, str]: Parsed tech stack as dictionary
        
    Raises:
        ValueError: If format is invalid
    """
    if not tech_stack or not tech_stack.strip():
        raise ValueError("Tech stack cannot be empty")
    
    try:
        result = {}
        parts = tech_stack.split(';')
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
            
            if ':' in part:
                skill, desc = part.split(':', 1)
                skill = skill.strip()
                desc = desc.strip()
                
                if not skill:
                    continue
                
                result[skill] = desc
            else:
                # If no description, use the whole part as skill name
                result[part] = "N/A"
        
        if not result:
            raise ValueError("No valid skills found in tech stack")
        
        return result
        
    except Exception as e:
        raise ValueError(f"Invalid tech stack format: {e}") from e
