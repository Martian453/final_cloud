from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from datetime import datetime
from database import create_db_and_tables, get_session
from models import Location, Device, Measurement
from pydantic import BaseModel
from typing import Dict, Any, Optional
from connection_manager import ConnectionManager

app = FastAPI(title="Environmental Cloud API")

# Initialize WebSocket Manager
manager = ConnectionManager()

# Import Auth
import auth

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

# CORS Setup
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://192.168.1.7",
    "http://192.168.1.7:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Model for Ingestion
# Pydantic Model for Registration
class LocationInput(BaseModel):
    area: str
    site_type: str
    label: Optional[str] = None

class RegisterDevicePayload(BaseModel):
    device_id: str
    device_type: str
    # location_id: str  <-- Removed, replaced by input
    location_input: Optional[LocationInput] = None
    location_id: Optional[str] = None # Allow manual ID if needed (backward compat)

    location_id: Optional[str] = None # Allow manual ID if needed (backward compat)

# Pydantic Model for Ingestion
class IngestPayload(BaseModel):
    device_id: str
    type: str  # 'aqi' or 'water'
    timestamp: Optional[str] = None
    data: Dict[str, float]

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/devices/register")
async def register_device(payload: RegisterDevicePayload, session: Session = Depends(get_session)):
    try:
        loc = None
        
        # Scenario A: User provided manual location_id (Backwards compatibility / Advanced)
        if payload.location_id:
            loc = session.exec(select(Location).where(Location.name == payload.location_id)).first()
            if not loc:
                loc = Location(name=payload.location_id, display_name=payload.location_id)
                session.add(loc)
                session.commit()
                session.refresh(loc)
        
        # Scenario B: User provided Smart Input (Area/Type) -> Auto-Generate ID
        elif payload.location_input:
            area = payload.location_input.area.upper().replace(" ", "")
            site_type = payload.location_input.site_type.upper().replace(" ", "")
            
            # Find next index
            # Simple heuristic: Count existing locations with same prefix
            # Note: In high-concurrency production, use DB sequence or atomic lock.
            existing = session.exec(select(Location).where(Location.area == payload.location_input.area, Location.site_type == payload.location_input.site_type)).all()
            index = len(existing) + 1
            
            generated_id = f"{area}_{site_type}_{index:02d}"
            
            # Create readable name
            friendly = f"{payload.location_input.area} {payload.location_input.site_type} #{index}"
            if payload.location_input.label:
                friendly += f" ({payload.location_input.label})"
            
            # Check if exists (idempotency for re-runs of script?)
            # Ideally we reuse if exact same metadata? 
            # For strictness: We created a new ID.
            # But what if I run script twice for same device? I should find the location *this* device is assigned to? 
            # Or just create/get the location defined. 
            # Let's check if generated_id exists
            loc = session.exec(select(Location).where(Location.name == generated_id)).first()
            if not loc:
                loc = Location(
                    name=generated_id,
                    display_name=friendly,
                    area=payload.location_input.area,
                    site_type=payload.location_input.site_type,
                    label=payload.location_input.label
                )
                session.add(loc)
                session.commit()
                session.refresh(loc)
        
        else:
            raise HTTPException(status_code=400, detail="Must provide location_id OR location_input")

        # 2. Upsert Device
        dev = session.get(Device, payload.device_id)
        if not dev:
            # New device
            dev = Device(device_id=payload.device_id, location_id=loc.id, type=payload.device_type)
            session.add(dev)
        else:
            # Move device to new location
            dev.location_id = loc.id
            dev.type = payload.device_type
            session.add(dev)
        
        session.commit()
        return {
            "status": "success", 
            "device_id": payload.device_id,
            "assigned_location_id": loc.name,
            "friendly_name": loc.display_name
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest")
async def ingest_data(payload: IngestPayload, session: Session = Depends(get_session)):
    try:
        # 1. Lookup Device & Location (Source of Truth)
        dev = session.get(Device, payload.device_id)
        if not dev:
             # Reject unregistered devices
             raise HTTPException(status_code=400, detail=f"Device {payload.device_id} not registered. Call /api/devices/register first.")
        
        # Get mapped Location
        loc = session.get(Location, dev.location_id)
        if not loc:
             raise HTTPException(status_code=500, detail="Device mapped to invalid location.")

        # 3. Store Measurements
        ts = datetime.utcnow()
        if payload.timestamp:
            try:
                # Accept ISO format from script
                ts = datetime.fromisoformat(payload.timestamp)
            except:
                pass

        for key, val in payload.data.items():
            meas = Measurement(
                location_id=loc.id,
                device_id=payload.device_id,
                type=key,
                value=val,
                timestamp=ts
            )
            session.add(meas)
        
        session.commit()

        # 4. Broadcast Real-Time Data (Using Resolved Location)
        ws_message = payload.dict()
        if not ws_message.get("timestamp"):
             ws_message["timestamp"] = ts.isoformat()
        
        # IMPORTANT: Add resolved location_id to message for frontend context
        ws_message["location_id"] = loc.name 

        await manager.broadcast(ws_message, loc.name)
        
        # EXACT FIX: Emit explicit heartbeat
        await manager.broadcast({
            "type": "heartbeat",
            "device_id": payload.device_id,
            "location_id": loc.name,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "online"
        }, loc.name)
        
        return {"status": "success", "rows": len(payload.data), "resolved_location": loc.name}

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ INGEST ERROR: {e}")
        return {"status": "error", "message": str(e)}

from fastapi import Query, status
from jose import JWTError, jwt
from models import User

@app.websocket("/ws/live/{location_id}")
async def websocket_endpoint(websocket: WebSocket, location_id: str, token: Optional[str] = Query(None)):
    if token is None:
        print("❌ WS: No token provided")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            print("❌ WS: Invalid token payload")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except JWTError:
        print("❌ WS: Token decode error")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, location_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, location_id)

@app.get("/api/status")
async def get_system_status(
    current_user: User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):

    # Get latest measurement timestamp system-wide
    # In multi-tenant, this should be per-user or per-location, but for "System Status" we check if *any* data is valid
    # or better: check if *current user's* locations have data.
    # For simplicity & robustness per prompt: "Latest measurement timestamp"
    stmt = select(Measurement).order_by(Measurement.timestamp.desc()).limit(1)
    last_meas = session.exec(stmt).first()
    
    is_online = False
    last_ts = None
    
    if last_meas:
        last_ts = last_meas.timestamp
        # Check 30s threshold
        diff = datetime.utcnow() - last_ts
        if diff.total_seconds() < 30:
            is_online = True
            
    return {
        "online": is_online,
        "last_ingest_ts": last_ts.isoformat() if last_ts else None
    }

from fastapi.responses import StreamingResponse
import csv
import io

@app.get("/api/export/csv")
async def export_csv(
    current_user: User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    # Export measurements for user's locations
    # 1. Get user location IDs
    loc_stmt = select(Location.id).join(Device).where(Device.owner_id == current_user.id)
    user_loc_ids = session.exec(loc_stmt).all()
    
    if not user_loc_ids:
        # Return empty CSV
        return StreamingResponse(io.StringIO("timestamp,location_id,device_id,type,value\n"), media_type="text/csv")

    # 2. Get Measurements (Limit 1000 for safety or filter by date)
    stmt = select(Measurement).where(Measurement.location_id.in_(user_loc_ids)).order_by(Measurement.timestamp.desc()).limit(1000)
    data = session.exec(stmt).all()
    
    # 3. Generate CSV
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["timestamp", "location_id", "device_id", "type", "value"])
    
    for row in data:
        writer.writerow([row.timestamp, row.location_id, row.device_id, row.type, row.value])
    
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@app.get("/api/locations/status")
async def get_locations_status(
    current_user: User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    # Filter locations by current user for strict privacy
    locs = session.exec(select(Location).where(Location.owner_id == current_user.id)).all()
    results = []
    
    for loc in locs:
        # Check if ANY device in location has recent data (< 30s)
        last_m = session.exec(select(Measurement).where(Measurement.location_id == loc.id).order_by(Measurement.timestamp.desc()).limit(1)).first()
        
        is_online = False
        last_seen = None
        if last_m:
            last_seen = last_m.timestamp
            diff = (datetime.utcnow() - last_m.timestamp).total_seconds()
            # Debug Log
            # print(f"🔍 Status Check [{loc.name}]: DB_TS={last_m.timestamp}, NOW={datetime.utcnow()}, Diff={diff}s")
            
            if diff < 45: # Relaxed from 30s to 45s for jitter
                is_online = True
        
        results.append({
            "location_id": loc.name,
            "name": loc.display_name or loc.name,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "online": is_online,
            "last_seen": last_seen.isoformat() if last_seen else None
        })
        
    return results

@app.get("/api/location/{location_id}/capabilities")
async def get_location_capabilities(location_id: str, session: Session = Depends(get_session)):
    # Default to True for now to ensure dashboard is always populated
    # In future, can query DB for device types at this location
    return {"has_aqi": True, "has_water": True}

@app.get("/api/devices")
async def get_my_devices(current_user: User = Depends(auth.get_current_user), session: Session = Depends(get_session)):
    # Return all devices owned by user, joined with location info
    statement = select(Device, Location).where(Device.owner_id == current_user.id).outerjoin(Location, Device.location_id == Location.id)
    results = session.exec(statement).all()
    
    data = []
    for dev, loc in results:
        # Check last measurement for this device
        last_m = session.exec(select(Measurement).where(Measurement.device_id == dev.device_id).order_by(Measurement.timestamp.desc()).limit(1)).first()
        is_online = False
        last_seen_ts = None
        
        if last_m:
             last_seen_ts = last_m.timestamp
             # 30s threshold
             if (datetime.utcnow() - last_m.timestamp).total_seconds() < 30:
                 is_online = True
                 
        data.append({
            "device_id": dev.device_id,
            "type": dev.type,
            "location_name": loc.display_name if loc else "Unassigned",
            "location_id": loc.name if loc else None,
            "last_seen": last_seen_ts.isoformat() if last_seen_ts else None,
            "status": "ONLINE" if is_online else "OFFLINE"
        })
    return data
