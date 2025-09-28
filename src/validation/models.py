"""
Pydantic models for data validation in Aligno project.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re


class JobOfferData(BaseModel):
    """Model for validating job offer data scraped from JustJoin.it"""
    
    job_url: str = Field(..., min_length=1, max_length=2048)
    job_title: str = Field(..., min_length=1, max_length=500)
    category: str = Field(..., min_length=1, max_length=100)
    company: str = Field(..., min_length=1, max_length=200)
    location: str = Field(..., min_length=1, max_length=200)
    salary_any: Optional[str] = Field(None, max_length=100)
    salary_b2b: Optional[str] = Field(None, max_length=100)
    salary_internship: Optional[str] = Field(None, max_length=100)
    salary_mandate: Optional[str] = Field(None, max_length=100)
    salary_perm: Optional[str] = Field(None, max_length=100)
    salary_specific_task: Optional[str] = Field(None, max_length=100)
    work_type: str = Field(..., min_length=1, max_length=50)
    experience: str = Field(..., min_length=1, max_length=50)
    employment_type: str = Field(..., min_length=1, max_length=50)
    operating_mode: str = Field(..., min_length=1, max_length=50)
    tech_stack: str = Field(..., min_length=1, max_length=10000)

    @validator('job_url')
    def validate_job_url(cls, v):
        """Validate job URL format"""
        if not v.startswith('https://justjoin.it/'):
            raise ValueError('Job URL must be a valid JustJoin.it URL')
        return v.strip()

    @validator('job_title', 'category', 'company', 'location', 'work_type', 'experience', 'employment_type', 'operating_mode')
    def validate_not_na(cls, v):
        """Ensure required fields are not 'N/A'"""
        if v.strip().upper() == 'N/A':
            raise ValueError('Required field cannot be "N/A"')
        return v.strip()

    @validator('tech_stack')
    def validate_tech_stack(cls, v):
        """Validate tech stack format"""
        if not v or v.strip() == '':
            raise ValueError('Tech stack cannot be empty')
        return v.strip()

    @validator('salary_any', 'salary_b2b', 'salary_internship', 'salary_mandate', 'salary_perm', 'salary_specific_task')
    def validate_salary_format(cls, v):
        """Validate salary format if provided"""
        if v is None or v.strip() == '':
            return None
        
        # More flexible salary pattern validation - allow any reasonable salary format
        salary_pattern = r'^[\d\s\-\.\,\+\/\:\w]+$'
        if not re.match(salary_pattern, v.strip(), re.IGNORECASE):
            raise ValueError(f'Invalid salary format: {v}')
        return v.strip()

    class Config:
        """Pydantic configuration"""
        validate_assignment = True
        extra = "forbid"  # Don't allow extra fields






class DatabaseConfig(BaseModel):
    """Model for validating database configuration"""
    
    database_url: Optional[str] = Field(None, max_length=2048)
    db_user: str = Field(default="aligno", min_length=1, max_length=100)
    db_password: Optional[str] = Field(None, max_length=200)
    db_host: str = Field(default="localhost", min_length=1, max_length=255)
    db_port: int = Field(default=5432, ge=1, le=65535)
    db_name: str = Field(default="aligno_db", min_length=1, max_length=100)
    
    @validator('database_url')
    def validate_database_url(cls, v):
        """Validate database URL format"""
        if v is None:
            return None
        
        if not v.startswith(('postgresql://', 'postgres://')):
            raise ValueError('Database URL must be a valid PostgreSQL connection string')
        return v.strip()

    @validator('db_name', 'db_user')
    def validate_identifier(cls, v):
        """Validate database identifiers"""
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', v):
            raise ValueError('Invalid identifier format (only alphanumeric and underscore, must start with letter or underscore)')
        return v

    @validator('db_host')
    def validate_host(cls, v):
        """Validate host format"""
        # Allow hostname, IP, or localhost
        hostname_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-\.]*[a-zA-Z0-9])?$'
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        
        if v == 'localhost' or re.match(hostname_pattern, v) or re.match(ip_pattern, v):
            return v
        
        raise ValueError('Invalid host format')

    class Config:
        validate_assignment = True
        extra = "forbid"




class ScraperConfig(BaseModel):
    """Model for validating scraper configuration"""
    
    headless: bool = Field(default=True)
    batch_size: int = Field(default=500, ge=1, le=10000)
    scroll_pause: float = Field(default=0.512, ge=0.1, le=5.0)
    max_idle: int = Field(default=5, ge=1, le=20)
    timeout: int = Field(default=30000, ge=5000, le=120000)
    max_offers: Optional[int] = Field(default=None, ge=1, le=100000, description="Maximum number of offers to scrape (None = no limit)")
    
    class Config:
        validate_assignment = True
        extra = "forbid"


class EnvironmentConfig(BaseModel):
    """Model for validating all environment variables"""
    
    database: DatabaseConfig
    scraper: ScraperConfig
    
    class Config:
        validate_assignment = True
        extra = "forbid"
