from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID

class Skill(BaseModel):
    id: UUID
    name: str # canonical_skill_name or original_skill_name
    frequency: Optional[int] = 0
    category: Optional[str] = None
    
    class Config:
        from_attributes = True

class Offer(BaseModel):
    job_url: str
    job_title: str
    company: str
    requiredSkills: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    match_score: Optional[int] = 0 # Calculated on frontend usually, but backend can provide pre-calc

class User(BaseModel):
    id: UUID
    email: str
    name: str # full_name or email prefix
    onboarding_completed: bool = False

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserSkillsRequest(BaseModel):
    skills: Optional[List[str]] = None
    antiSkills: Optional[List[str]] = None
    highlightedSkills: Optional[List[str]] = None
    skippedSkills: Optional[List[str]] = None
    confirmedTutorials: Optional[List[str]] = None

class UserSkillsResponse(BaseModel):
    skills: List[str] = Field(default_factory=list)
    antiSkills: List[str] = Field(default_factory=list)
    highlightedSkills: List[str] = Field(default_factory=list)
    skippedSkills: List[str] = Field(default_factory=list)
    confirmedTutorials: List[str] = Field(default_factory=list)

class EducationEntry(BaseModel):
    school_name: str
    field_of_study: str
    specialization: Optional[str] = None
    graduation_year: Optional[int] = None

class ExperienceEntry(BaseModel):
    job_title: str
    company_name: str
    description: Optional[str] = None
    start_date: Optional[date] = None # Make optional to handle validation manually if needed
    end_date: Optional[date] = None
    is_current: bool = False

    @field_validator('job_title', 'company_name', mode='before')
    @classmethod
    def strip_required_strings(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator('description', mode='before')
    @classmethod
    def normalize_description(cls, v):
        if isinstance(v, str):
            value = v.strip()
            return value or None
        return v

    @field_validator('start_date', 'end_date', mode='before')
    @classmethod
    def parse_year_only(cls, v):
        if not v or v == "":
            return None
        if isinstance(v, (int, str)) and len(str(v)) == 4:
            return f"{v}-01-01"
        return v

    @model_validator(mode='after')
    def validate_required_fields(self):
        if not self.job_title or not self.company_name or self.start_date is None:
            raise ValueError("Each experience entry requires a job title, company name, and start year.")
        if self.is_current:
            self.end_date = None
        return self

class UserProfile(BaseModel):
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    contact_email: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    data_processing_clause: Optional[str] = None

class OnboardingRequest(BaseModel):
    profile: UserProfile
    education: List[EducationEntry] = Field(default_factory=list)
    experience: List[ExperienceEntry] = Field(default_factory=list)
