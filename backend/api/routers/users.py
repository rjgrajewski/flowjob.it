from fastapi import APIRouter, Depends, HTTPException, Body
from backend.database import get_db_pool
from backend.api.repository.user_repo import UserRepository
from backend.models import UserSkillsRequest, UserSkillsResponse, OnboardingRequest
import asyncpg

router = APIRouter(prefix="/api/users", tags=["users"])

def get_user_repo() -> UserRepository:
    pool = get_db_pool()
    return UserRepository(pool)

@router.get("/{user_id}/skills", response_model=UserSkillsResponse)
async def get_skills(user_id: str, repo: UserRepository = Depends(get_user_repo)):
    try:
        return await repo.get_user_skills(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/skills", response_model=UserSkillsResponse)
async def save_skills(
    user_id: str, 
    body: UserSkillsRequest, 
    repo: UserRepository = Depends(get_user_repo)
):
    try:
        return await repo.save_user_skills(user_id, body.skills, body.antiSkills)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/onboarding")
async def save_onboarding(
    user_id: str,
    body: OnboardingRequest,
    repo: UserRepository = Depends(get_user_repo)
):
    try:
        await repo.save_onboarding_full(user_id, body)
        return {"status": "success"}
    except Exception as e:
        print(f"Error saving onboarding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/onboarding")
async def get_onboarding(user_id: str, repo: UserRepository = Depends(get_user_repo)):
    try:
        data = await repo.get_onboarding_full(user_id)
        if not data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching onboarding: {e}")
        raise HTTPException(status_code=500, detail=str(e))
