import logging
from fastapi import APIRouter, Depends, HTTPException, Response
from backend.database import get_db_pool
from backend.api.repository.user_repo import UserRepository
from backend.api.auth_utils import get_current_user_id
from backend.models import UserSkillsRequest, UserSkillsResponse, OnboardingRequest

# Prevents CDN/browser from caching user-specific responses
NO_CACHE_HEADERS = {"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"}

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["users"])

def get_user_repo() -> UserRepository:
    pool = get_db_pool()
    return UserRepository(pool)

@router.get("/{user_id}/skills", response_model=UserSkillsResponse)
async def get_skills(
    user_id: str,
    response: Response,
    repo: UserRepository = Depends(get_user_repo),
    current_user: str = Depends(get_current_user_id),
):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    response.headers.update(NO_CACHE_HEADERS)
    try:
        return await repo.get_user_skills(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/skills", response_model=UserSkillsResponse)
async def save_skills(
    user_id: str, 
    body: UserSkillsRequest, 
    repo: UserRepository = Depends(get_user_repo),
    current_user: str = Depends(get_current_user_id),
):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        return await repo.save_user_skills(
            user_id,
            body.skills,
            body.antiSkills,
            highlighted_skills=body.highlightedSkills or []
        )
    except Exception as e:
        logger.exception("save_skills failed for user_id=%s: %s", user_id, e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/onboarding")
async def save_onboarding(
    user_id: str,
    body: OnboardingRequest,
    repo: UserRepository = Depends(get_user_repo),
    current_user: str = Depends(get_current_user_id),
):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        await repo.save_onboarding_full(user_id, body)
        return {"status": "success"}
    except Exception as e:
        logger.exception("Error saving onboarding for user_id=%s: %s", user_id, e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/onboarding")
async def get_onboarding(
    user_id: str,
    response: Response,
    repo: UserRepository = Depends(get_user_repo),
    current_user: str = Depends(get_current_user_id),
):
    if current_user != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    response.headers.update(NO_CACHE_HEADERS)
    try:
        data = await repo.get_onboarding_full(user_id)
        if not data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching onboarding for user_id=%s: %s", user_id, e)
        raise HTTPException(status_code=500, detail=str(e))
