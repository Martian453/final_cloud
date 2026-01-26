import requests

BASE_URL = "http://localhost:8000/api"
AUTH_URL = f"{BASE_URL}/auth"
REG_URL = f"{BASE_URL}/devices/register"

# 1. SETUP USER
USER_EMAIL = "admin@aqi.com"
USER_PASS = "admin123"

# Register User (Ignore if exists)
# Register User (Ignore if exists)
try:
    reg_res = requests.post(f"{AUTH_URL}/register", json={
        "email": USER_EMAIL, 
        "password": USER_PASS, 
        "full_name": "Admin User"
    })
    if reg_res.status_code not in [200, 201]:
        print(f"[!] Registration Info: {reg_res.text}")
except Exception as e:
    print(f"[!] Registration Error: {e}")

# Login to get Token
print("Logging in...")
res = requests.post(f"{AUTH_URL}/login", data={"username": USER_EMAIL, "password": USER_PASS})
if res.status_code != 200:
    print(f"Login Failed: {res.text}")
    exit(1)

TOKEN = res.json()["access_token"]
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
print("Login Success!")

# 2. REGISTER DEVICES
devices = [
    {
        "device_id": "DEV_CAM_01",
        "device_type": "aqi_camera",
        "location_input": {
            "area": "Yelahanka",
            "site_type": "Pole",
            "label": "Main Junction"
        }
    },
    {
        "device_id": "DEV_WATER_01",
        "device_type": "water_sensor",
        "location_input": {
            "area": "Yelahanka",
            "site_type": "Borewell",
            "label": "Apartment A Block"
        }
    }
]

for dev in devices:
    try:
        r = requests.post(REG_URL, json=dev, headers=HEADERS)
        if r.status_code == 200:
            print(f"Registered {dev['device_id']} -> {r.json()['friendly_name']}")
        else:
             print(f"Failed {dev['device_id']}: {r.text}")
    except Exception as e:
        print(f"Error registering {dev['device_id']}: {e}")
