from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # Map location_id -> List of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, location_id: str):
        await websocket.accept()
        if location_id not in self.active_connections:
            self.active_connections[location_id] = []
        self.active_connections[location_id].append(websocket)

    def disconnect(self, websocket: WebSocket, location_id: str):
        if location_id in self.active_connections:
            if websocket in self.active_connections[location_id]:
                self.active_connections[location_id].remove(websocket)
            if not self.active_connections[location_id]:
                del self.active_connections[location_id]

    async def broadcast(self, message: dict, location_id: str):
        if location_id in self.active_connections:
            # Iterate over a copy to avoid modification issues during iteration (though unlikely async)
            for connection in self.active_connections[location_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Handle broken connections if necessary
                    pass
