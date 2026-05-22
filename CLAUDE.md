# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-Agent System starter kit using LangGraph with FastAPI backend and Next.js frontend. Implements ReAct-style agent architecture supporting OpenAI and Mistral LLM providers with per-request switching.

## Monorepo Structure

- **apps/api**: FastAPI + LangGraph backend (Python 3.12, uv)
- **apps/web**: Next.js 15 + shadcn/ui frontend (Bun)
- **packages/**: Reserved for shared packages

## Development Commands

### Docker (Full Stack)
```bash
cp .env.example .env  # Configure API keys
docker compose up --build
# Frontend: http://localhost:3000 | API: http://localhost:8000/docs
```

### Backend (apps/api)
```bash
cd apps/api
uv sync                    # Install dependencies
uv run api dev             # Dev server with hot-reload
uv run api serve           # Production server
uv run pytest              # Run tests
uv run ruff check .        # Lint
```

### Frontend (apps/web)
```bash
cd apps/web
bun install                # Install dependencies
bun dev                    # Dev server with Turbopack
bun build && bun start     # Production build
bun lint                   # ESLint
bun format                 # Prettier
bun typecheck              # TypeScript check
```

## Architecture

### Agent Graph (apps/api/src/api/agent/)
- **graph.py**: LangGraph ReAct agent with `call_model` → conditional routing → `tools` loop
- **state.py**: `AgentState` TypedDict with messages using `add_messages` reducer
- **tools.py**: Tool definitions (`get_current_time`, `calculate`)
- **checkpointer.py**: PostgreSQL checkpointer for conversation persistence

The graph is built per-request to support provider switching. Routing logic: if last message has `tool_calls` → execute tools → loop back; otherwise → END.

### API Endpoints (apps/api/src/api/routers/agent.py)
- `POST /api/chat`: Full response
- `POST /api/chat/stream`: SSE streaming response
- `GET /api/providers`: List available providers

### Frontend Chat (apps/web/)
- **components/chat/**: Chat UI components with provider selector
- **hooks/use-chat.ts**: React hook managing chat state and API calls
- **lib/api.ts**: SSE streaming implementation using eventsource-parser

## Key Environment Variables

```bash
LLM_PROVIDER=openai              # Default: openai | mistral
OPENAI_API_KEY=                  # Required for OpenAI
MISTRAL_API_KEY=                 # Required for Mistral
DATABASE_URL=                    # PostgreSQL connection
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Adding New Agents

1. Create graph in `apps/api/src/api/agent/`
2. Add router in `apps/api/src/api/routers/`
3. Mount router in `apps/api/src/api/main.py`

## Code Quality

- **Python**: Ruff (line length 100), pytest with async mode
- **TypeScript**: ESLint 9 + Prettier with Tailwind plugin, strict mode
