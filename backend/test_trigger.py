import requests
import time

API_URL = "http://localhost:8000/api/ingest"

payload = {
    # No Location ID
    "device_id": "TEST_DEV_WS",
    "type": "aqi",
    "data": {
        "pm25": 99.9, 
        "co": 5.5
    }
}

try:
    print(f"Sending payload to {API_URL}...")
    r = requests.post(API_URL, json=payload)
    print(f"Status Code: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")
