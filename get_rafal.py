import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.database import init_db_pool, get_db_pool, close_db_pool
import urllib.request
import json

async def run():
    await init_db_pool()
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT user_id FROM user_profiles WHERE first_name='Rafał' OR contact_email='rj.grajewski@icloud.com'")
        user_id = str(row['user_id']) if row else None
    await close_db_pool()
    
    if user_id:
        req = urllib.request.Request(f"http://localhost:8000/api/users/{user_id}/onboarding")
        data = json.loads(urllib.request.urlopen(req).read().decode())
        with open("rafal_data.json", "w") as f:
            json.dump(data, f, indent=2)
        print(f"Saved to rafal_data.json for {user_id}")
    else:
        print("User not found")

if __name__ == "__main__":
    asyncio.run(run())
