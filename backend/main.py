from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
import os
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, desc
from datetime import datetime
from database import create_db_and_tables, get_session
from models import Location, Device, Measurement, User
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
    # Allow production frontend
    os.getenv("FRONTEND_URL", ""), 
    # Optional: Allow any Vercel preview (insecure for high security apps, fine for this)
    # "*", 
]

# Clean empty strings
origins = [origin for origin in origins if origin]

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
async def register_device(
    payload: RegisterDevicePayload, 
    current_user: User = Depends(auth.get_current_user), # Secure Endpoint
    session: Session = Depends(get_session)
):
    try:
        # 1. Validate Device ID (Check if already owned by ANOTHER user)
        existing_device = session.exec(select(Device).where(Device.device_id == payload.device_id)).first()
        if existing_device and existing_device.owner_id and existing_device.owner_id != current_user.id:
            raise HTTPException(status_code=400, detail="Device is already registered to another user.")

        loc = None
        
        # 2. Find or Create Location
        # Scenario A: User provided manual location_id (Backwards compatibility / Advanced)
        if payload.location_id:
            loc = session.exec(select(Location).where(Location.name == payload.location_id)).first()
            if not loc:
                loc = Location(
                    name=payload.location_id, 
                    display_name=payload.location_id, 
                    owner_id=current_user.id # Set Owner
                )
                session.add(loc)
                session.commit()
                session.refresh(loc)
            elif not loc.owner_id:
                # Claim orphaned location
                loc.owner_id = current_user.id
                session.add(loc)
                session.commit()
        
        # Scenario B: User provided Smart Input (Area/Type) -> Auto-Generate ID
        # Scenario B: User provided Smart Input (Area/Type) -> Smart Grouping
        elif payload.location_input:
            area = payload.location_input.area.upper().replace(" ", "")
            site_type = payload.location_input.site_type.upper().replace(" ", "")
            
            # 1. OPTIMIZATION: Check if User already has a location with this name
            # If yes, group this new device into that existing location!
            
            # Fetch all user locations first (usually small list) to do robust case-insensitive check in Python
            # This avoids dealing with ILIKE complexities across different DBs
            all_user_locs = session.exec(select(Location).where(Location.owner_id == current_user.id)).all()
            
            existing_user_loc = None
            for u_loc in all_user_locs:
                 # Check against normalized inputs
                 u_area = (u_loc.area or "").upper().replace(" ", "")
                 u_type = (u_loc.site_type or "").upper().replace(" ", "")
                 
                 if u_area == area and u_type == site_type:
                     existing_user_loc = u_loc
                     break

            if existing_user_loc:
                # REUSE EXISTING LOCATION
                loc = existing_user_loc
            else:
                # CREATE NEW LOCATION
                # Find next index globally or for user? Using global sequence style for unique IDs
                # We need to find matching global locations to determine index
                # Again, doing simple loose search
                existing_locs = session.exec(select(Location)).all()
                count = 0
                for el in existing_locs:
                    e_area = (el.area or "").upper().replace(" ", "")
                    e_type = (el.site_type or "").upper().replace(" ", "")
                    if e_area == area and e_type == site_type:
                        count += 1
                
                index = count + 1
                
                generated_id = f"{area}_{site_type}_{index:02d}"
                
                # Create readable name
                friendly = f"{payload.location_input.area} {payload.location_input.site_type} #{index}"
                if payload.location_input.label:
                    friendly += f" ({payload.location_input.label})"
                
                loc = Location(
                    name=generated_id,
                    display_name=friendly,
                    area=payload.location_input.area,
                    site_type=payload.location_input.site_type,
                    label=payload.location_input.label,
                    owner_id=current_user.id 
                )
                    display_name=friendly,
                    area=payload.location_input.area,
                    site_type=payload.location_input.site_type,
                    label=payload.location_input.label,
                    owner_id=current_user.id 
                )
                session.add(loc)
                session.commit()
                session.refresh(loc)

        if not loc:
            raise HTTPException(status_code=400, detail="Unable to determine location.")

        # 3. Register/Claim Device
        if existing_device:
            # Re-assign or update existing
            existing_device.location_id = loc.id
            existing_device.owner_id = current_user.id
            existing_device.type = payload.device_type
            session.add(existing_device)
        else:
            # Create new
            new_device = Device(
                device_id=payload.device_id,
                type=payload.device_type,
                location_id=loc.id,
                owner_id=current_user.id
            )
            session.add(new_device)
        
        session.commit()
        
        return {
            "status": "success", 
            "message": f"Device {payload.device_id} registered successfully to {loc.display_name}",
            "location_name": loc.display_name,
            "device_id": payload.device_id
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Registration Error: {e}")
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

@app.delete("/api/devices/{device_id}")
async def delete_device(device_id: str, current_user: User = Depends(auth.get_current_user), session: Session = Depends(get_session)):
    # 1. Find the device and verify ownership
    device = session.exec(select(Device).where(Device.device_id == device_id, Device.owner_id == current_user.id)).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found or access denied")
    
    # 2. Production Rule: Soft Delete / Unlink
    # Do NOT delete measurements (historical data preservation)
    # Do NOT delete the device row (it just becomes unclaimed)
    
    device.owner_id = None
    session.add(device)
    session.commit()
    
    return {"message": "Device unlinked successfully"}

@app.get("/api/export/csv")
async def export_csv(current_user: User = Depends(auth.get_current_user), session: Session = Depends(get_session)):
    import csv
    import io
    from fastapi.responses import StreamingResponse

    # Get user's devices
    devices = session.exec(select(Device).where(Device.owner_id == current_user.id)).all()
    device_ids = [d.device_id for d in devices]
    
    if not device_ids:
        # Return empty CSV
        return StreamingResponse(io.StringIO("timestamp,device_id,type,value\n"), media_type="text/csv")

    # Get last 1000 measurements for these devices
    measurements = session.exec(select(Measurement).where(Measurement.device_id.in_(device_ids)).order_by(Measurement.timestamp.desc()).limit(1000)).all()
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Device ID", "Location", "Type", "Value"])
    
    location_map = {d.device_id: d.location_id for d in devices} # Naive map
    
    for m in measurements:
        writer.writerow([m.timestamp, m.device_id, location_map.get(m.device_id, "Unknown"), m.type, m.value])
        
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=env_export.csv"})

@app.get("/api/public/locations")
def get_public_locations(session: Session = Depends(get_session)):
    """
    Public Endpoint: Returns all visible locations with their live status.
    Used for the Public Dashboard (No Login).
    """
    locations = session.exec(select(Location)).all()
    
    # Re-writing the loop effectively to get ALL latest values per location
    final_result = []
    current_time = datetime.utcnow()
    
    for loc in locations:
        devices = session.exec(select(Device).where(Device.location_id == loc.id)).all()
        is_online = False
        last_seen = None
        
        # Dictionary to hold latest values for this location
        loc_values = {
            "pm25": 0, "pm10": 0, "co": 0, "no2": 0, "o3": 0, "so2": 0,
            "level": 0, "ph": 0, "turbidity": 0
        }
        
        for dev in devices:
            # Get latest measurements for this device
            measures = session.exec(select(Measurement).where(Measurement.device_id == dev.device_id).order_by(Measurement.timestamp.desc()).limit(20)).all()
            
            if measures:
                # Online Check (using absolute latest)
                latest = measures[0]
                if (current_time - latest.timestamp).total_seconds() < 45:
                    is_online = True
                
                if not last_seen or latest.timestamp > last_seen:
                    last_seen = latest.timestamp
                    
                # Update values map (prefer newer data)
                seen_types = set()
                for m in measures:
                    if m.type not in seen_types:
                        if m.type in loc_values:
                            loc_values[m.type] = m.value
                        seen_types.add(m.type)

        # Get last 50 measurements for charts (simple history)
        chart_history = {
            "labels": [],
            "pm25": [], "pm10": [], "co": [], "no2": [], "o3": [], "so2": [],
            "level": [], "ph": [], "turbidity": []
        }
        
        # Fetch last 50 mixed measurements for this location's devices
        if devices:
            device_ids = [d.device_id for d in devices]
            # Fetch LAST 100 measurements (descending) then reverse to be chronological
            history_measures = session.exec(select(Measurement).where(Measurement.device_id.in_(device_ids)).order_by(Measurement.timestamp.desc()).limit(100)).all()
            history_measures.reverse() 
            
            # Time Bucketing for Charts
            time_buckets = {}
            
            for hm in history_measures:
                # Normalize Type
                key = hm.type.lower().replace(".", "").replace(" ", "")
                if key in chart_history:
                    ts_str = hm.timestamp.strftime("%H:%M")
                    if ts_str not in time_buckets:
                        time_buckets[ts_str] = {}
                    time_buckets[ts_str][key] = hm.value
            
            # Flatten to arrays (Sorted by time)
            sorted_times = sorted(time_buckets.keys())
            chart_history["labels"] = sorted_times
            
            # Explicit keys to ensure all arrays are populated equally
            metrics = ["pm25", "pm10", "co", "no2", "o3", "so2", "level", "ph", "turbidity"]
            
            for t in sorted_times:
                data_point = time_buckets[t]
                for m in metrics:
                    # Append actual value or 0 if missing for this specific timestamp
                    chart_history[m].append(data_point.get(m, 0.0))

        final_result.append({
            "location_id": loc.name,
            "name": loc.display_name or loc.name,
            "area": loc.area,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "online": is_online,
            "last_seen": last_seen.isoformat() if last_seen else None,
            "data": {
                **loc_values,
                "chartData": chart_history
            }
        })
        
    return final_result
