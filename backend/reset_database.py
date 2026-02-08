
import os
import sys

# Add current directory to path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from database import create_db_and_tables, engine
from models import Location, Device, Measurement, User  # Import models to register them with SQLModel
from sqlmodel import SQLModel

DB_FILE = "env_cloud_v2.db"

def reset_db():
    print(f"🗑️  Deleting existing database: {DB_FILE}...")
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
            print("✅ Database file deleted.")
        except PermissionError:
            print(f"❌ ERROR: Could not delete {DB_FILE}. Is the server still running?")
            print("Please STOP the backend server (Ctrl+C) and try again.")
            return
    else:
        print("⚠️  Database file not found, skipping delete.")

    print("🔄 Creating new database schema...")
    create_db_and_tables()
    print("✅ Database reset complete! You can now restart the server.")

if __name__ == "__main__":
    current_path = os.getcwd()
    print(f"Current Directory: {current_path}")
    
    # Confirm
    print("WARNING: This will delete ALL data in 'env_cloud_v2.db'.")
    confirm = input("Are you sure? (y/n): ")
    if confirm.lower() == 'y':
        reset_db()
    else:
        print("Cancelled.")
