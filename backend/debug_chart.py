import requests
import json

try:
    res = requests.get("http://localhost:8000/api/public/locations")
    data = res.json()
    
    found = False
    for loc in data:
        if "Borewell" in loc['name']:
            found = True
            print(f"Location: {loc['name']}")
            cd = loc['data'].get('chartData', {})
            print(f"Labels:   {cd.get('labels', [])[-5:]}") # Last 5
            print(f"PM2.5:    {cd.get('pm25', [])[-5:]}")
            print(f"PM10:     {cd.get('pm10', [])[-5:]}")
            print(f"SO2:      {cd.get('so2', [])[-5:]}")
    
    if not found:
        print("Location 'Borewell' not found.")

except Exception as e:
    print(e)
