import asyncio
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.database import init_db_pool, get_db_pool, close_db_pool

async def get_user_and_test():
    await init_db_pool()
    pool = get_db_pool()
    user_id = None
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT user_id FROM user_profiles LIMIT 1")
        if row:
            user_id = row['user_id']
            print("Found user_id:", user_id)
        else:
            print("No users found.")
    await close_db_pool()
    
    if user_id:
        import requests
        import json
        url = f"http://localhost:8000/api/users/{user_id}/onboarding"
        
        # We need to fetch current onboarding logic to see if there are validation errors on existing data
        get_url = f"http://localhost:8000/api/users/{user_id}/onboarding"
        current_data = requests.get(get_url).json()
        
        print("Current data fetched.")
        
        # Test 1: Save it back exactly as it is (should work if data was valid)
        res1 = requests.post(url, json=current_data)
        print("Status plain resave:", res1.status_code, res1.text)
        
        # Test 2: Add a large base64 image
        current_data['profile']['profile_picture'] = "data:image/jpeg;base64," + ("A" * 1024 * 500) # 500kb
        res2 = requests.post(url, json=current_data)
        print("Status with 500kb image:", res2.status_code, res2.text[:200])

if __name__ == "__main__":
    asyncio.run(get_user_and_test())
