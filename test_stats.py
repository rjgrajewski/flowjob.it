import asyncio
from backend.database import init_db_pool, close_db_pool, get_db_pool
from backend.api.repository.offers_repo import OffersRepository
from backend.api.repository.skills_repo import SkillsRepository

async def main():
    await init_db_pool()
    pool = get_db_pool()
    offers_repo = OffersRepository(pool)
    skills_repo = SkillsRepository(pool)
    
    o_count = await offers_repo.get_offers_count()
    s_count = await skills_repo.get_skills_count()
    
    print(f"Offers count: {o_count}")
    print(f"Skills count: {s_count}")
    
    await close_db_pool()

if __name__ == "__main__":
    asyncio.run(main())
