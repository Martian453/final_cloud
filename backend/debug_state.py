import sys
import os
sys.path.append(os.getcwd())

from sqlmodel import select, Session
from database import engine
from models import User, Device, Location

def debug_state():
    with Session(engine) as session:
        print("--- USERS ---")
        users = session.exec(select(User)).all()
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Name: {u.full_name}")
            
        print("\n--- LOCATIONS ---")
        locs = session.exec(select(Location)).all()
        for l in locs:
            print(f"ID: {l.id}, Name: {l.name}, OwnerID: {l.owner_id}")

        print("\n--- DEVICES ---")
        devs = session.exec(select(Device)).all()
        for d in devs:
            print(f"ID: {d.device_id}, LocID: {d.location_id}, OwnerID: {d.owner_id}, Type: {d.type}")

        print("\n--- DB FILE INFO ---")
        print(f"Engine URL: {engine.url}")

if __name__ == "__main__":
    debug_state()
