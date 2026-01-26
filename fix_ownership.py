from sqlmodel import Session, select, create_engine
from backend.models import User, Location, Device

# Connect to DB (adjust path if needed, assuming local sqlite)
# FOUND CORRECT DB: env_cloud_v2.db
sqlite_url = "sqlite:///d:/AQI+Water/Final_cloud/backend/env_cloud_v2.db"
engine = create_engine(sqlite_url)

def fix_ownership(target_email):
    with Session(engine) as session:
        # 1. Find the User
        user = session.exec(select(User).where(User.email == target_email)).first()
        if not user:
            print(f"[!] User {target_email} not found!")
            return

        print(f"[+] Found User: {user.full_name} (ID: {user.id})")

        # 2. Find the Active Location (ID 8 from logs)
        loc = session.get(Location, 8)
        if not loc:
            print("[!] Location 8 not found!")
            return
        
        print(f"[*] Current Owner of Location 8 ({loc.name}): {loc.owner_id}")

        # 3. Update Ownership
        if loc.owner_id != user.id:
            loc.owner_id = user.id
            session.add(loc)
            session.commit()
            print(f"[+] SUCCESS! Transferred Location 8 to User {user.id}")
        else:
            print("[+] User already owns this location.")

        # 4. Verify Devices
        dev = session.exec(select(Device).where(Device.location_id == 8)).all()
        for d in dev:
            if d.owner_id != user.id:
                d.owner_id = user.id
                session.add(d)
                print(f"   - Transferred Device {d.device_id} to User {user.id}")
        
        session.commit()
        print("[+] All done. Refresh Dashboard!")

if __name__ == "__main__":
    # email = input("Enter your dashboard login email: ")
    email = "rohan@gmail.com" # Hardcoded from logs
    fix_ownership(email)
