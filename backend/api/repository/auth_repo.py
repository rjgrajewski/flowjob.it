from asyncpg import Pool
import bcrypt

class AuthRepository:
    def __init__(self, pool: Pool):
        self.pool = pool

    async def create_user(self, email: str, password: str) -> dict:
        # bcrypt requires bytes
        password_bytes = password.encode('utf-8')
        password_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO users (email, provider, provider_id, password_hash)
                VALUES ($1, 'email', $1, $2)
                """,
                email.strip().lower(),
                password_hash,
            )
            row = await conn.fetchrow(
                "SELECT id, email, full_name, onboarding_completed FROM users WHERE email = $1",
                email.strip().lower(),
            )
            return {
                "id": row["id"],
                "email": row["email"],
                "name": row["full_name"] or row["email"].split("@")[0],
                "onboarding_completed": row["onboarding_completed"]
            }

    async def authenticate_user(self, email: str, password: str) -> dict:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, email, full_name, password_hash, onboarding_completed FROM users WHERE email = $1 AND provider = 'email'",
                email.strip().lower(),
            )
            if not row or not row["password_hash"]:
                return None
            password_bytes = password.encode('utf-8')
            hash_bytes = row["password_hash"].encode('utf-8')
            if not bcrypt.checkpw(password_bytes, hash_bytes):
                return None
            return {
                "id": row["id"],
                "email": row["email"],
                "name": row["full_name"] or row["email"].split("@")[0],
                "onboarding_completed": row["onboarding_completed"]
            }
