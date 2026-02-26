from fastapi import APIRouter, Depends, HTTPException
from backend.database import get_db_pool
from backend.api.repository.auth_repo import AuthRepository
from backend.api.auth_utils import create_access_token
from backend.models import RegisterRequest, LoginRequest
import asyncpg
import re

router = APIRouter(prefix="/api", tags=["auth"])

def get_auth_repo() -> AuthRepository:
    pool = get_db_pool()
    return AuthRepository(pool)

def validate_password(password: str) -> bool:
    if len(password) < 8: return False
    if not re.search(r'[A-Z]', password): return False
    if not re.search(r'[a-z]', password): return False
    if not re.search(r'\d', password): return False
    if not re.search(r'[^a-zA-Z0-9]', password): return False
    return True

@router.post("/register")
async def register(body: RegisterRequest, repo: AuthRepository = Depends(get_auth_repo)):
    try:
        if not validate_password(body.password):
            raise ValueError("Password does not meet security requirements.")
            
        user_info = await repo.create_user(body.email, body.password)
        token = create_access_token(str(user_info["id"]), user_info["email"])
        return {**user_info, "token": token}
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="This email address is already registered.")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save user. Ensure migration 003 has been applied (password_hash column). Details: {str(e)}",
        )

@router.post("/login")
async def login(body: LoginRequest, repo: AuthRepository = Depends(get_auth_repo)):
    user_info = await repo.authenticate_user(body.email, body.password)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user_info["id"]), user_info["email"])
    return {**user_info, "token": token}
