from asyncpg import Pool
from typing import List

class OffersRepository:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def get_all_offers(self) -> List[dict]:
        query = """
            SELECT 
                o.job_url, o.job_title, o.company,
                o.location, o.operating_mode, o.employment_type,
                o.experience, o.work_schedule, 
                o.salary_any, o.salary_b2b, o.salary_permanent,
                o.salary_mandate, o.salary_internship, o.salary_specific_task,
                array_agg(COALESCE(s.canonical_skill_name, s.original_skill_name)) as skills
            FROM offers o
            LEFT JOIN offer_skills os ON o.job_url = os.job_url
            LEFT JOIN skills s ON os.skill_id = s.uuid
            GROUP BY o.job_url, o.job_title, o.company,
                     o.location, o.operating_mode, o.employment_type,
                     o.experience, o.work_schedule, 
                     o.salary_any, o.salary_b2b, o.salary_permanent,
                     o.salary_mandate, o.salary_internship, o.salary_specific_task
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
            
            results = []
            for row in rows:
                # Filter out None values from skills array if any
                skills_list = [s for s in row["skills"] if s] if row["skills"] else []
                # Salary choosing logic: B2B > Permanent > Any > Mandate > Task > Internship
                salary = (
                    row["salary_b2b"] or 
                    row["salary_permanent"] or 
                    row["salary_any"] or 
                    row["salary_mandate"] or 
                    row["salary_specific_task"] or 
                    row["salary_internship"]
                )

                results.append({
                    "id": row["job_url"],
                    "title": row["job_title"],
                    "company": row["company"],
                    "location": row["location"],
                    "operatingMode": row["operating_mode"],
                    "employmentType": row["employment_type"],
                    "experience": row["experience"],
                    "workSchedule": row["work_schedule"],
                    "salary": salary,
                    "requiredSkills": skills_list,
                })
            return results

    async def get_offers_count(self) -> int:
        query = "SELECT COUNT(*) FROM offers"
        async with self.pool.acquire() as conn:
            count = await conn.fetchval(query)
            return count or 0
