import sys
import os
# Add backend directory to sys.path
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from main import app
from auth import create_access_token

client = TestClient(app)

def test_endpoints():
    print("1. Authenticating...")
    token = create_access_token(data={"sub": "test@example.com", "id": 1})
    headers = {"Authorization": f"Bearer {token}"}
    
    print("2. Testing /api/status...")
    res = client.get("/api/status", headers=headers)
    if res.status_code == 200:
        print(f"   ✅ Success: {res.json()}")
    else:
        print(f"   ❌ Failed: {res.status_code} - {res.text}")

    print("3. Testing /api/export/csv...")
    res = client.get("/api/export/csv", headers=headers)
    if res.status_code == 200:
        print(f"   ✅ Success: CSV Stream Init")
    else:
        print(f"   ❌ Failed: {res.status_code} - {res.text}")

    print("4. Testing /api/devices...")
    res = client.get("/api/devices", headers=headers)
    if res.status_code == 200:
        print(f"   ✅ Success: {res.json()}")
    else:
        print(f"   ❌ Failed: {res.status_code} - {res.text}")
        
    print("5. Testing /api/locations/status...")
    res = client.get("/api/locations/status", headers=headers)
    if res.status_code == 200:
        print(f"   ✅ Success: {res.json()}")
    else:
        print(f"   ❌ Failed: {res.status_code} - {res.text}")

if __name__ == "__main__":
    try:
        test_endpoints()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
