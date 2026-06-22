import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database.session import engine, async_session
from app.database.base import Base
from app.models import User, Thread, Vote, Message, File, OTPVerification, Tribe, TribeMember
from app.auth.jwt_handler import decode_access_token
from app.websocket.manager import manager
from app.services.message_service import save_message
from app.schemas.message import MessageCreate
from app.routes import auth, users, threads, chat, files, otp, search, tribes
from app.routes import comments as comments_routes
from app.routes import tribe_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="ThreadIt API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register all routers
app.include_router(otp.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(threads.router)
app.include_router(chat.router)
app.include_router(files.router)
app.include_router(search.router)
app.include_router(tribes.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str = Query(...)):
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") == "message":
                receiver_id = data["receiver_id"]
                content = data["content"]

                async with async_session() as db:
                    msg = await save_message(
                        db, user_id,
                        MessageCreate(receiver_id=receiver_id, content=content),
                    )
                    await db.commit()
                    msg_out = {
                        "type": "message",
                        "id": msg.id,
                        "sender_id": user_id,
                        "receiver_id": receiver_id,
                        "content": content,
                        "sent_time": msg.sent_time.isoformat(),
                        "read_status": False,
                    }

                await manager.send_to_user(receiver_id, msg_out)
                await manager.send_to_user(user_id, msg_out)

            elif data.get("type") == "read":
                sender_id = data["sender_id"]
                async with async_session() as db:
                    from app.services.message_service import mark_as_read
                    await mark_as_read(db, sender_id, user_id)
                    await db.commit()
                await manager.send_to_user(
                    sender_id, {"type": "read_receipt", "reader_id": user_id}
                )

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception:
        manager.disconnect(user_id, websocket)
