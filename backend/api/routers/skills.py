from fastapi import APIRouter, Depends, Query
from typing import Optional
from backend.database import get_db_pool
from backend.api.repository.skills_repo import SkillsRepository

router = APIRouter(prefix="/api/skills", tags=["skills"])

def get_skills_repo() -> SkillsRepository:
    pool = get_db_pool()
    return SkillsRepository(pool)

@router.get("")
async def get_skills(
    selected: Optional[str] = Query(None, description="Comma-separated list of selected skills"),
    repo: SkillsRepository = Depends(get_skills_repo)
):
    selected_skills = selected.split(',') if selected else None
    return await repo.get_all_skills(selected_skills)
