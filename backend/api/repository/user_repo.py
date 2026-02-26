import logging
from asyncpg import Pool
from typing import List, Dict

logger = logging.getLogger(__name__)

class UserRepository:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_user_skills(self, user_id: str) -> dict:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT s.canonical_skill_name, s.original_skill_name, us.skill_type, COALESCE(us.show_on_cv, false) AS show_on_cv
                FROM user_skills us
                JOIN skills s ON us.skill_id = s.uuid
                WHERE us.user_id = $1
                """,
                user_id
            )
            
            skills = []
            anti_skills = []
            highlighted_skills = []
            
            for row in rows:
                name = row["canonical_skill_name"] or row["original_skill_name"]
                if row["skill_type"] == 'HAS':
                    skills.append(name)
                    if row["show_on_cv"]:
                        highlighted_skills.append(name)
                elif row["skill_type"] == 'AVOIDS':
                    anti_skills.append(name)
                    
            return {
                "skills": list(set(skills)),
                "antiSkills": list(set(anti_skills)),
                "highlightedSkills": list(set(highlighted_skills))
            }

    async def save_user_skills(
        self,
        user_id: str,
        skills: List[str],
        anti_skills: List[str],
        highlighted_skills: List[str] = None
    ) -> dict:
        highlighted_skills = highlighted_skills or []
        async with self.pool.acquire() as conn:
            # We need to map string names back to UUIDs from the skills table first.
            # If no names match, we do NOT delete existing rows (avoid wiping data).
            all_names = skills + anti_skills
            if not all_names:
                async with conn.transaction():
                    await conn.execute("DELETE FROM user_skills WHERE user_id = $1", user_id)
                return {"skills": [], "antiSkills": [], "highlightedSkills": []}

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

            inserts = []
            added = set()
            for s in set(skills):
                for uid in name_to_uuids.get(s, []):
                    if uid not in added:
                        inserts.append((user_id, uid, 'HAS'))
                        added.add(uid)
            for a in set(anti_skills):
                for uid in name_to_uuids.get(a, []):
                    if uid not in added:
                        inserts.append((user_id, uid, 'AVOIDS'))
                        added.add(uid)

            # If we have requested skills but none matched the DB, do not delete – log and return current state
            if not inserts and all_names:
                unmatched = set(all_names)
                for r in skill_records:
                    if r["canonical_skill_name"] in unmatched:
                        unmatched.discard(r["canonical_skill_name"])
                    if r["original_skill_name"] in unmatched:
                        unmatched.discard(r["original_skill_name"])
                logger.warning(
                    "save_user_skills: no rows to insert for user_id=%s; requested names may not exist in skills table. Unmatched sample: %s",
                    user_id,
                    list(unmatched)[:10],
                )
                return await self.get_user_skills(user_id)

            async with conn.transaction():
                await conn.execute("DELETE FROM user_skills WHERE user_id = $1", user_id)
                if inserts:
                    await conn.executemany(
                        """
                        INSERT INTO user_skills (user_id, skill_id, skill_type)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING
                        """,
                        inserts
                    )
                skills_set = set(skills)
                highlighted_valid = [h for h in highlighted_skills if h in skills_set]
                highlight_uuids = []
                for name in highlighted_valid:
                    for uid in name_to_uuids.get(name, []):
                        if uid in added:
                            highlight_uuids.append(uid)
                            break
                await conn.execute(
                    """
                    UPDATE user_skills SET show_on_cv = (skill_id = ANY($1))
                    WHERE user_id = $2 AND skill_type = 'HAS'
                    """,
                    highlight_uuids,
                    user_id
                )

        return await self.get_user_skills(user_id)
    async def save_onboarding_full(self, user_id: str, data: 'OnboardingRequest') -> bool:
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # 1. Update/Insert Profile
                await conn.execute(
                    """
                    INSERT INTO user_profiles (user_id, first_name, last_name, phone_number, contact_email, location, bio, profile_picture, data_processing_clause)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (user_id) DO UPDATE SET
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        phone_number = EXCLUDED.phone_number,
                        contact_email = EXCLUDED.contact_email,
                        location = EXCLUDED.location,
                        bio = EXCLUDED.bio,
                        profile_picture = EXCLUDED.profile_picture,
                        data_processing_clause = EXCLUDED.data_processing_clause,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    user_id,
                    data.profile.first_name,
                    data.profile.last_name,
                    data.profile.phone_number,
                    data.profile.contact_email,
                    data.profile.location,
                    data.profile.bio,
                    data.profile.profile_picture,
                    getattr(data.profile, 'data_processing_clause', None)
                )

                # 2. Update Education (Delete old, insert new)
                await conn.execute("DELETE FROM user_education WHERE user_id = $1", user_id)
                education_inserts = [
                    (user_id, e.school_name, e.field_of_study, e.specialization, e.graduation_year)
                    for e in data.education
                ]
                if education_inserts:
                    await conn.executemany(
                        """
                        INSERT INTO user_education (user_id, school_name, field_of_study, specialization, graduation_year)
                        VALUES ($1, $2, $3, $4, $5)
                        """,
                        education_inserts
                    )

                # 3. Update Experience (Delete old, insert new)
                await conn.execute("DELETE FROM user_experience WHERE user_id = $1", user_id)
                experience_inserts = [
                    (user_id, ex.job_title, ex.company_name, ex.description, ex.start_date, ex.end_date, ex.is_current)
                    for ex in data.experience
                ]
                if experience_inserts:
                    await conn.executemany(
                        """
                        INSERT INTO user_experience (user_id, job_title, company_name, description, start_date, end_date, is_current)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        """,
                        experience_inserts
                    )

                # 4. Mark onboarding as completed
                await conn.execute(
                    "UPDATE users SET onboarding_completed = TRUE WHERE id = $1",
                    user_id
                )
        return True

    async def get_onboarding_full(self, user_id: str) -> dict:
        async with self.pool.acquire() as conn:
            profile_row = await conn.fetchrow(
                "SELECT first_name, last_name, phone_number, contact_email, location, bio, profile_picture, data_processing_clause FROM user_profiles WHERE user_id = $1",
                user_id
            )
            
            if not profile_row:
                return None

            edu_rows = await conn.fetch(
                "SELECT school_name, field_of_study, specialization, graduation_year FROM user_education WHERE user_id = $1 ORDER BY graduation_year DESC NULLS LAST",
                user_id
            )

            exp_rows = await conn.fetch(
                "SELECT job_title, company_name, description, start_date, end_date, is_current FROM user_experience WHERE user_id = $1 ORDER BY start_date DESC",
                user_id
            )

            return {
                "profile": dict(profile_row),
                "education": [dict(r) for r in edu_rows],
                "experience": [dict(r) for r in exp_rows]
            }

