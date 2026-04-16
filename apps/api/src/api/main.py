from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.agent.checkpointer import create_checkpointer
from api.config import settings
from api.routers import agent_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise the Postgres checkpointer shared across all providers.
    Shutdown: close the connection pool.
    """
    logger.info("Starting up — initialising Postgres checkpointer…")
    checkpointer, pool = await create_checkpointer()
    # Store the checkpointer so each request can build the right provider graph
    app.state.checkpointer = checkpointer
    logger.info("Checkpointer ready (provider graph built per-request)")

    yield

    logger.info("Shutting down — closing connection pool…")
    await pool.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Multi-Agent Starter API",
        version="0.1.0",
        description="FastAPI + LangGraph multi-agent backend",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(agent_router)

    # ── Health ────────────────────────────────────────────────────────────────
    @app.get("/api/health", tags=["health"])
    async def health():
        return {"status": "ok"}

    # ── Providers ─────────────────────────────────────────────────────────────
    @app.get("/api/providers", tags=["providers"])
    async def providers():
        """Return the list of supported LLM providers and the current default."""
        return {
            "providers": ["openai", "mistral"],
            "default": settings.llm_provider,
        }

    return app


app = create_app()
