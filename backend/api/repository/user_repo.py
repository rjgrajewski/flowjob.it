from asyncpg import Pool
from typing import List, Dict

class UserRepository:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_user_skills(self, user_id: str) -> dict:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT s.canonical_skill_name, s.original_skill_name, us.skill_type
                FROM user_skills us
                JOIN skills s ON us.skill_id = s.uuid
                WHERE us.user_id = $1
                """,
                user_id
            )
            
            skills = []
            anti_skills = []
            
            for row in rows:
                name = row["canonical_skill_name"] or row["original_skill_name"]
                if row["skill_type"] == 'HAS':
                    skills.append(name)
                elif row["skill_type"] == 'AVOIDS':
                    anti_skills.append(name)
                    
            return {
                "skills": list(set(skills)),
                "antiSkills": list(set(anti_skills))
            }

    async def save_user_skills(self, user_id: str, skills: List[str], anti_skills: List[str]) -> dict:
        async with self.pool.acquire() as conn:
            # We need a transaction to delete old and insert new safely
            async with conn.transaction():
                # Clear existing
                await conn.execute("DELETE FROM user_skills WHERE user_id = $1", user_id)
                
                # We need to map string names back to UUIDs
                # Since skills table has either canonical or original matching the string
                # we match against both.
                
                # Fetch all relevant skills
                all_names = skills + anti_skills
                if not all_names:
                    return {"skills": [], "antiSkills": []}
                
                skill_records = await conn.fetch(
                    """
                    SELECT uuid, canonical_skill_name, original_skill_name 
                    FROM skills 
                    WHERE canonical_skill_name = ANY($1) OR original_skill_name = ANY($1)
                    """,
                    all_names
                )
                
                # Map names to their UUIDs. Prefer canonical if it matches.
                name_to_uuids = {name: [] for name in all_names}
                for record in skill_records:
                    if record["canonical_skill_name"] in all_names:
                        name_to_uuids[record["canonical_skill_name"]].append(record["uuid"])
                    if record["original_skill_name"] in all_names:
                        name_to_uuids[record["original_skill_name"]].append(record["uuid"])
                
                # Prepare inserts
                # Use a set to prevent duplicate inserts if the user provided duplicate strings
                # Or if multiple canonical hits mapped to same string (we just pick the first UUID we found for that string)
                
                inserts = []
                # Helper to add inserts safely
                added = set()
                
                for s in set(skills):
                    for uid in name_to_uuids.get(s, []):
                        if uid not in added:
                            inserts.append((user_id, uid, 'HAS'))
                            added.add(uid)
                            
                for a in set(anti_skills):
                    for uid in name_to_uuids.get(a, []):
                        # Don't add to anti if already in HAS
                        if uid not in added:
                            inserts.append((user_id, uid, 'AVOIDS'))
                            added.add(uid)
                
                if inserts:
                    await conn.executemany(
                        """
                        INSERT INTO user_skills (user_id, skill_id, skill_type)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING
                        """,
                        inserts
                    )
        
        return await self.get_user_skills(user_id)
