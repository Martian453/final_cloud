import requests
import time
import random
import json

# Configuration matching user's ESP32 code
CLOUD_API = "http://localhost:8000/api/ingest"
DEVICE_ID = "DEV_WATER_01"
DEVICE_TYPE = "water"

def read_ph():
    # Simulate pH logic: normal range 6.5 - 8.5
    return round(random.uniform(6.5, 8.5), 2)

def read_turbidity():
    # Simulate turbidity index: 0 - 300
    return random.randint(0, 100) # Clear water usually low

def read_water_level():
    # Simulate water level: 0.0 - 5.0 ft
    return round(random.uniform(3.0, 4.8), 2)

def send_to_cloud():
    payload = {
        "device_id": DEVICE_ID,
        "type": DEVICE_TYPE,
        "data": {
            "ph": read_ph(),
            "turbidity": read_turbidity(),
            "level": read_water_level()
        }
    }
    
    try:
        print(f"Sending: {json.dumps(payload)}")
        # ESP32 sets 8s timeout
        response = requests.post(CLOUD_API, json=payload, timeout=8)
        
        if response.status_code == 200:
            print(f"[OK] Response: {response.text}")
        else:
            print(f"[ERR] HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"[ERR] Exception: {e}")

if __name__ == "__main__":
    print(f"--- Simulating ESP32: {DEVICE_ID} ---")
    print("Press Ctrl+C to stop")
    
    while True:
        send_to_cloud()
        time.sleep(5) # 5s cadence
