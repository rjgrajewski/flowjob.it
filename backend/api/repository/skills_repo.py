from asyncpg import Pool
from typing import List, Optional

class SkillsRepository:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_all_skills(self, selected_skills: Optional[List[str]] = None) -> List[dict]:
        if not selected_skills:
            query = """
                SELECT 
                    MAX(s.uuid::text) as id, 
                    COALESCE(s.canonical_skill_name, s.original_skill_name) as name, 
                    MAX(s.category) as category,
                    COUNT(os.job_url) as frequency
                FROM skills s
                LEFT JOIN offer_skills os ON s.uuid = os.skill_id
                GROUP BY COALESCE(s.canonical_skill_name, s.original_skill_name)
                ORDER BY frequency DESC, name ASC
            """
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query)
        else:
            query = """
                WITH user_offers AS (
                    SELECT os.job_url, COUNT(DISTINCT coalesce(s.canonical_skill_name, s.original_skill_name)) as match_score
                    FROM offer_skills os
                    JOIN skills s ON os.skill_id = s.uuid
                    WHERE coalesce(s.canonical_skill_name, s.original_skill_name) = ANY($1::text[])
                    GROUP BY os.job_url
                ),
                skill_freq AS (
                    SELECT 
                        os.skill_id,
                        SUM(uo.match_score) as freq
                    FROM offer_skills os
                    JOIN user_offers uo ON os.job_url = uo.job_url
                    GROUP BY os.skill_id
                )
                SELECT 
                    MAX(s.uuid::text) as id, 
                    COALESCE(s.canonical_skill_name, s.original_skill_name) as name, 
                    MAX(s.category) as category,
                    COALESCE(SUM(sf.freq), 0) as frequency
                FROM skills s
                LEFT JOIN skill_freq sf ON s.uuid = sf.skill_id
                GROUP BY COALESCE(s.canonical_skill_name, s.original_skill_name)
                ORDER BY frequency DESC, name ASC
            """
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, selected_skills)
                
        return [
            {
                "id": str(row["id"]), 
                "name": row["name"], 
                "category": row["category"],
                "frequency": row["frequency"]
            }
            for row in rows
        ]

    async def get_skills_count(self) -> int:
        query = "SELECT COUNT(*) FROM skills"
        async with self.pool.acquire() as conn:
            count = await conn.fetchval(query)
            return count or 0
