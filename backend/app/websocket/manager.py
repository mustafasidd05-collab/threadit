import json
from fastapi import WebSocket
from typing import Dict


class ConnectionManager:
    """Manages active WebSocket connections indexed by user ID."""

    def __init__(self):
        self.active_connections: Dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            payload = json.dumps(message)
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    pass

    def is_online(self, user_id: str) -> bool:
        return (
            user_id in self.active_connections
            and len(self.active_connections[user_id]) > 0
        )


manager = ConnectionManager()
