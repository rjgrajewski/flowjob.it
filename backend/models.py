from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
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
    email: str
    name: str
