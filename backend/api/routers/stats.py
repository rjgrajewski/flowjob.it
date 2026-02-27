from fastapi import APIRouter, Depends
from backend.database import get_db_pool
from backend.api.repository.offers_repo import OffersRepository
from backend.api.repository.skills_repo import SkillsRepository

router = APIRouter(prefix="/api/stats", tags=["stats"])

def get_offers_repo() -> OffersRepository:
    pool = get_db_pool()
    return OffersRepository(pool)

def get_skills_repo() -> SkillsRepository:
    pool = get_db_pool()
    return SkillsRepository(pool)

@router.get("")
async def get_stats(
    offers_repo: OffersRepository = Depends(get_offers_repo),
    skills_repo: SkillsRepository = Depends(get_skills_repo)
):
    offers_count = (await offers_repo.get_offers_count() // 100) * 100
    skills_count = (await skills_repo.get_skills_count() // 100) * 100
    return {
        "offers": offers_count,
        "skills": skills_count
    }
