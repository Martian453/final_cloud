from sqlmodel import Session, select, create_engine
from backend.models import Device, Location

# Connect to DB
sqlite_url = "sqlite:///d:/AQI+Water/Final_cloud/backend/env_cloud_v2.db"
engine = create_engine(sqlite_url)

def move_camera():
    with Session(engine) as session:
        # 1. Find Camera
        cam = session.get(Device, "DEV_CAM_01")
        if not cam:
            print("[!] Camera DEV_CAM_01 not found!")
            return

        print(f"[*] Camera currently at Location ID: {cam.location_id}")

        # 2. Find Target Location (ID 8)
        target_loc = session.get(Location, 8)
        if not target_loc:
            print("[!] Target Location 8 not found!")
            return
        
        print(f"[*] Target Location: {target_loc.name} (ID: {target_loc.id})")

        # 3. Move it
        if cam.location_id != 8:
            cam.location_id = 8
            session.add(cam)
            session.commit()
            print("[+] SUCCESS! Moved Camera to Location 8.")
        else:
            print("[+] Camera is already at Location 8.")

if __name__ == "__main__":
    move_camera()
