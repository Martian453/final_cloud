from sqlmodel import SQLModel, create_engine, Session

import os

# Default to SQLite for local, Use env var for Prod
sqlite_url = os.getenv("DATABASE_URL", "sqlite:///env_cloud_v2.db")

# Railway/Postgres requires "postgresql://" not "postgres://"
if sqlite_url.startswith("postgres://"):
    sqlite_url = sqlite_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in sqlite_url else {}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
