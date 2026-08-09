from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.agent import MultistepCarAgent
from app.database import init_db, update_cars_with_vins
from app.hybrid_data_service import hybrid_data_service

app = FastAPI(
    title="AI Car Matchmaker Agent Backend",
    version="1.0.0",
    description="Multistep agent backend with A2UI streaming and MCP Apps",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
update_cars_with_vins()  # Add VINs to existing cars for API photo fetching

sessions: dict[str, MultistepCarAgent] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str = ""
    form_data: dict | None = None


class ChatResponse(BaseModel):
    text: str
    a2ui_events: list[dict]
    current_state: str


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest) -> ChatResponse:
    if req.session_id not in sessions:
        sessions[req.session_id] = MultistepCarAgent()

    agent = sessions[req.session_id]
    response = await agent.process_message(req.message, req.form_data)
    return ChatResponse(**response)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "service": "AI Car Matchmaker Backend"}


@app.get("/api/cars")
async def get_cars(
    category: Optional[str] = None,
    max_budget: Optional[float] = None,
    is_rental: bool = True,
    limit: int = 50
):
    """Get cars from hybrid data service"""
    cars = await hybrid_data_service.query_cars(
        category=category,
        max_budget=max_budget,
        is_rental=is_rental,
        limit=limit
    )
    return {"cars": cars}


@app.delete("/api/session/{session_id}")
def reset_session(session_id: str) -> dict[str, str]:
    sessions.pop(session_id, None)
    return {"status": "session_reset", "session_id": session_id}
