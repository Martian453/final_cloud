from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: Optional[str] = None

class Location(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id") # Link to User
    name: str # The unique ID: YELAHANKA_BOREWELL_01
    display_name: Optional[str] = None 
    area: Optional[str] = None
    site_type: Optional[str] = None
    label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Device(SQLModel, table=True):
    device_id: str = Field(primary_key=True)
    location_id: int = Field(foreign_key="location.id")
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id") # Link to User
    type: str  # 'aqi_camera', 'water_sensor'

class Measurement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    location_id: int = Field(foreign_key="location.id")
    device_id: str = Field(foreign_key="device.device_id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    type: str  # 'pm25', 'ph', etc.
    value: float
