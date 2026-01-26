import sys
import os
sys.path.append(os.getcwd())

from sqlmodel import select
from database import get_session, create_db_and_tables
from models import User, Device, Location

def fix_ownership(target_email="test@example.com"):
    # Manual session management since not in FastAPI request
    from database import engine
    from sqlmodel import Session
    
    with Session(engine) as session:
        print(f"1. Looking for user '{target_email}'...")
        user = session.exec(select(User).where(User.email == target_email)).first()
        
        if not user:
            print("   [!] User not found. Falling back to ID=1...")
            user = session.get(User, 1)
            
        if not user:
            print("   [!] No user found (ID=1). Creating default user 'test@example.com'...")
            from auth import get_password_hash
            user = User(
                email=target_email,
                hashed_password=get_password_hash("password123"), # Default password
                full_name="Test User"
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"   [+] Created User: {user.email} (ID: {user.id})")

        print(f"   [+] Target User: {user.email} (ID: {user.id})")
        
        # Repair Locations
        print("2. Scanning orphaned Locations...")
        locs = session.exec(select(Location).where(Location.owner_id == None)).all()
        for loc in locs:
            print(f"   -> Claiming Location: {loc.name} ({loc.display_name})")
            loc.owner_id = user.id
            session.add(loc)
            
        # Repair Devices
        print("3. Scanning orphaned Devices...")
        devs = session.exec(select(Device).where(Device.owner_id == None)).all()
        for dev in devs:
            print(f"   -> Claiming Device: {dev.device_id}")
            dev.owner_id = user.id
            session.add(dev)
            
        session.commit()
        print(f"\nSUCCESS: Claimed {len(locs)} locations and {len(devs)} devices.")
        print("   Dashboard should now show 'ONLINE' and 'My Devices' populated.")

if __name__ == "__main__":
    fix_ownership()
