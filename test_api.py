import requests
import time
import subprocess
import os

proc = subprocess.Popen(["python", "-m", "uvicorn", "backend.main:app", "--port", "8001"])
time.sleep(3) # Wait for server to start

try:
    response = requests.post("http://localhost:8001/api/register", json={
        "email": "testabc123@example.com",
        "password": "Password123!"
    })
    print("STATUS:", response.status_code)
    print("BODY:", response.text)
finally:
    proc.terminate()
