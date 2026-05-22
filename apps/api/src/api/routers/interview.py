"""Interview generator API router."""

from __future__ import annotations

import json
import logging
import uuid
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from api.config import LLMProvider, settings
from api.interview.graph import AGENT_DISPLAY_NAMES, build_interview_graph
from api.interview.state import (
    InterviewGuidance,
    InterviewPackage,
    InterviewType,
)
from api.interview.utils import extract_text_from_pdf, sanitize_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview", tags=["interview"])


# ── Request / Response schemas ────────────────────────────────────────────────


class InterviewGenerateResponse(BaseModel):
    """Response for non-streaming interview generation."""

    thread_id: str
    interview_type: InterviewType
    provider: LLMProvider
    package: InterviewPackage


class AgentProgressEvent(BaseModel):
    """Progress event during interview generation."""

    agent: str = Field(..., description="Agent name")
    display_name: str = Field(..., description="Human-readable agent name")
    status: str = Field(..., description="Agent status: running, completed, error")
    message: Optional[str] = Field(default=None, description="Status message")


class InterviewTypes(BaseModel):
    """Response for interview types endpoint."""

    types: list[dict[str, str]]


# ── Helpers ───────────────────────────────────────────────────────────────────


def _get_graph_for(request, provider: LLMProvider | None):
    """Build a compiled graph wired to *provider*, reusing the shared checkpointer."""
    checkpointer = request.app.state.checkpointer
    try:
        return build_interview_graph(checkpointer=checkpointer, provider=provider)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _resolve_provider(requested: LLMProvider | None) -> LLMProvider:
    return requested or settings.llm_provider


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/types", response_model=InterviewTypes, summary="List available interview types")
async def get_interview_types():
    """Return the list of supported interview types."""
    return InterviewTypes(
        types=[
            {"value": "technical", "label": "Technical Interview"},
            {"value": "culture_fit", "label": "Culture Fit Interview"},
            {"value": "system_design", "label": "System Design Interview"},
            {"value": "leadership", "label": "Leadership Interview"},
        ]
    )


@router.post("/generate", summary="Generate interview package with SSE streaming")
async def generate_interview(
    request: __import__("fastapi").Request,
    job_description: str = Form(..., description="Job description text"),
    interview_type: InterviewType = Form(..., description="Type of interview"),
    resume: UploadFile = File(..., description="Resume PDF file"),
    provider: Optional[LLMProvider] = Form(
        default=None,
        description="LLM provider to use (openai or mistral)",
    ),
    thread_id: Optional[str] = Form(default=None, description="Thread ID for persistence"),
):
    """Generate a comprehensive interview package.

    This endpoint accepts:
    - job_description: The full job description text
    - resume: A PDF file containing the candidate's resume
    - interview_type: Type of interview (technical, culture_fit, system_design, leadership)
    - provider: (optional) LLM provider to use

    Returns Server-Sent Events with:
    - `progress` events: Agent progress updates
    - `result` event: Final interview package
    - `error` event: Error details if something fails
    """
    # Validate file type
    if not resume.filename or not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Resume must be a PDF file",
        )

    # Read and parse PDF
    try:
        pdf_bytes = await resume.read()
        resume_text = extract_text_from_pdf(pdf_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to process resume PDF")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process resume: {exc}",
        ) from exc

    # Sanitize job description for safe database storage
    job_description = sanitize_text(job_description)

    # Resolve provider and thread
    resolved_provider = _resolve_provider(provider)
    resolved_thread_id = thread_id or str(uuid.uuid4())

    # Build graph
    graph = _get_graph_for(request, resolved_provider)
    config = {"configurable": {"thread_id": resolved_thread_id}}

    # Initial state
    initial_state = {
        "messages": [],
        "job_description": job_description,
        "resume_text": resume_text,
        "interview_type": interview_type,
        "parsed_jd": None,
        "parsed_resume": None,
        "gap_analysis": None,
        "questions": None,
        "interview_structure": None,
        "rubric": None,
        "guidance": None,
        "error": None,
    }

    async def event_generator() -> AsyncGenerator[dict, None]:
        """Generate SSE events for interview generation progress."""
        try:
            last_agent = None
            final_state = None

            async for event in graph.astream_events(
                initial_state,
                config=config,
                version="v2",
            ):
                kind = event["event"]

                # Track node execution for progress updates
                if kind == "on_chain_start":
                    node_name = event.get("name", "")
                    if node_name in AGENT_DISPLAY_NAMES and node_name != last_agent:
                        last_agent = node_name
                        progress = AgentProgressEvent(
                            agent=node_name,
                            display_name=AGENT_DISPLAY_NAMES[node_name],
                            status="running",
                        )
                        yield {
                            "event": "progress",
                            "data": progress.model_dump_json(),
                        }

                elif kind == "on_chain_end":
                    node_name = event.get("name", "")
                    if node_name in AGENT_DISPLAY_NAMES:
                        # Check for errors in the output
                        output = event.get("data", {}).get("output", {})
                        error = output.get("error") if isinstance(output, dict) else None

                        progress = AgentProgressEvent(
                            agent=node_name,
                            display_name=AGENT_DISPLAY_NAMES[node_name],
                            status="error" if error else "completed",
                            message=error,
                        )
                        yield {
                            "event": "progress",
                            "data": progress.model_dump_json(),
                        }

                        if error:
                            yield {
                                "event": "error",
                                "data": json.dumps({"detail": error}),
                            }
                            return

                # Capture final state
                if kind == "on_chain_end" and event.get("name") == "LangGraph":
                    final_state = event.get("data", {}).get("output", {})

            # Build and return the final package
            if final_state:
                # Handle error in final state
                if final_state.get("error"):
                    yield {
                        "event": "error",
                        "data": json.dumps({"detail": final_state["error"]}),
                    }
                    return

                # Build interview package
                try:
                    package = InterviewPackage(
                        thread_id=resolved_thread_id,
                        interview_type=interview_type,
                        total_duration_minutes=sum(
                            s.duration_minutes
                            for s in (final_state.get("interview_structure") or [])
                        ),
                        parsed_jd=final_state.get("parsed_jd"),
                        parsed_resume=final_state.get("parsed_resume"),
                        gap_analysis=final_state.get("gap_analysis"),
                        questions=final_state.get("questions") or [],
                        structure=final_state.get("interview_structure") or [],
                        rubric=final_state.get("rubric") or [],
                        guidance=final_state.get("guidance")
                        or InterviewGuidance(
                            opening_script="",
                            closing_script="",
                            time_management_tips=[],
                            candidate_specific_notes=[],
                        ),
                    )

                    yield {
                        "event": "result",
                        "data": json.dumps(
                            {
                                "thread_id": resolved_thread_id,
                                "provider": resolved_provider,
                                "package": package.model_dump(),
                            }
                        ),
                    }
                except Exception as exc:
                    logger.exception("Failed to build interview package")
                    yield {
                        "event": "error",
                        "data": json.dumps({"detail": f"Failed to build package: {exc}"}),
                    }
            else:
                yield {
                    "event": "error",
                    "data": json.dumps({"detail": "No output received from interview generator"}),
                }

            yield {
                "event": "done",
                "data": json.dumps(
                    {"thread_id": resolved_thread_id, "provider": resolved_provider}
                ),
            }

        except Exception as exc:
            logger.exception("Error during interview generation")
            yield {
                "event": "error",
                "data": json.dumps({"detail": str(exc)}),
            }

    return EventSourceResponse(event_generator())


@router.get("/{thread_id}", summary="Get interview package by thread ID")
async def get_interview(
    thread_id: str,
    request: __import__("fastapi").Request,
):
    """Retrieve a previously generated interview package by thread ID.

    Note: This requires the checkpointer to have stored the conversation state.
    """
    checkpointer = request.app.state.checkpointer
    if checkpointer is None:
        raise HTTPException(
            status_code=501,
            detail="Checkpointer not available - cannot retrieve past interviews",
        )

    # Try to get state from checkpointer
    try:
        config = {"configurable": {"thread_id": thread_id}}
        # Build a graph just to access the checkpointer
        graph = build_interview_graph(checkpointer=checkpointer)
        state = await graph.aget_state(config)

        if not state or not state.values:
            raise HTTPException(
                status_code=404,
                detail=f"Interview not found for thread_id: {thread_id}",
            )

        values = state.values
        interview_type = values.get("interview_type", "technical")

        package = InterviewPackage(
            thread_id=thread_id,
            interview_type=interview_type,
            total_duration_minutes=sum(
                s.duration_minutes for s in (values.get("interview_structure") or [])
            ),
            parsed_jd=values.get("parsed_jd"),
            parsed_resume=values.get("parsed_resume"),
            gap_analysis=values.get("gap_analysis"),
            questions=values.get("questions") or [],
            structure=values.get("interview_structure") or [],
            rubric=values.get("rubric") or [],
            guidance=values.get("guidance")
            or InterviewGuidance(
                opening_script="",
                closing_script="",
                time_management_tips=[],
                candidate_specific_notes=[],
            ),
        )

        return {"thread_id": thread_id, "package": package.model_dump()}

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Failed to retrieve interview for thread {thread_id}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve interview: {exc}",
        ) from exc
