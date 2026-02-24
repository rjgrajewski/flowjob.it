from pydantic import BaseModel, EmailStr
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
    requiredSkills: List[str] = []
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
    skills: List[str] = []
    antiSkills: List[str] = []

class UserSkillsResponse(BaseModel):
    skills: List[str]
    antiSkills: List[str]

class EducationEntry(BaseModel):
    school_name: str
    field_of_study: str
    specialization: Optional[str] = None
    graduation_year: Optional[int] = None

class ExperienceEntry(BaseModel):
    job_title: str
    company_name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: bool = False

class UserProfile(BaseModel):
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    contact_email: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None

class OnboardingRequest(BaseModel):
    profile: UserProfile
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []
