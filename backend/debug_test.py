import requests
import json

try:
    res = requests.get("http://localhost:8000/api/public/locations")
    data = res.json()
    
    for loc in data:
        print(f"Location: {loc['name']}")
        print(f"Data: {json.dumps(loc['data'], indent=2)}")
except Exception as e:
    print(e)
