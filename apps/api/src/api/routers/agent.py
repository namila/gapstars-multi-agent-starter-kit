from __future__ import annotations

import json
import logging
import uuid
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from api.agent.graph import build_graph
from api.config import LLMProvider, settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


# ── Request / Response schemas ────────────────────────────────────────────────


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message text")
    thread_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Conversation thread ID. Reuse the same ID to continue a conversation.",
    )
    provider: Optional[LLMProvider] = Field(
        default=None,
        description=(
            "LLM provider to use for this request. "
            "One of 'openai' or 'mistral'. "
            "Defaults to the server's LLM_PROVIDER env var."
        ),
    )


class ChatResponse(BaseModel):
    thread_id: str
    content: str
    provider: LLMProvider


# ── Helpers ───────────────────────────────────────────────────────────────────


def _get_graph_for(request, provider: LLMProvider | None):
    """Build a compiled graph wired to *provider*, reusing the shared checkpointer."""
    checkpointer = request.app.state.checkpointer
    try:
        return build_graph(checkpointer=checkpointer, provider=provider)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _resolve_provider(requested: LLMProvider | None) -> LLMProvider:
    return requested or settings.llm_provider


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("", response_model=ChatResponse, summary="Send a message and get a full response")
async def chat(body: ChatRequest, request: __import__("fastapi").Request):
    """Invoke the agent and return the complete response as JSON."""
    provider = _resolve_provider(body.provider)
    graph = _get_graph_for(request, provider)
    config = {"configurable": {"thread_id": body.thread_id}}

    result = await graph.ainvoke(
        {"messages": [HumanMessage(content=body.message)]},
        config=config,
    )

    last_message = result["messages"][-1]
    return ChatResponse(
        thread_id=body.thread_id,
        content=last_message.content,
        provider=provider,
    )


@router.post("/stream", summary="Send a message and stream the response via SSE")
async def chat_stream(body: ChatRequest, request: __import__("fastapi").Request):
    """Invoke the agent and stream tokens back as Server-Sent Events.

    Each SSE event has one of the following types:
    - ``token``  — a partial text token from the model
    - ``done``   — final event, data contains ``{"thread_id": "...", "provider": "..."}``
    - ``error``  — data contains ``{"detail": "..."}``
    """
    provider = _resolve_provider(body.provider)
    graph = _get_graph_for(request, provider)
    config = {"configurable": {"thread_id": body.thread_id}}

    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            async for event in graph.astream_events(
                {"messages": [HumanMessage(content=body.message)]},
                config=config,
                version="v2",
            ):
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    chunk = event["data"].get("chunk")
                    if chunk and chunk.content:
                        yield {
                            "event": "token",
                            "data": json.dumps({"token": chunk.content}),
                        }

            yield {
                "event": "done",
                "data": json.dumps({"thread_id": body.thread_id, "provider": provider}),
            }
        except Exception as exc:
            logger.exception("Error during agent stream")
            yield {
                "event": "error",
                "data": json.dumps({"detail": str(exc)}),
            }

    return EventSourceResponse(event_generator())
