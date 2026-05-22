"""Interview generator LangGraph definition."""

from __future__ import annotations

import logging
from typing import Literal

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph

from api.agent.graph import build_llm
from api.config import LLMProvider
from api.interview.agents.jd_parser import create_jd_parser_agent
from api.interview.agents.matching import create_matching_agent
from api.interview.agents.orchestrator import finalize_agent, orchestrator_agent
from api.interview.agents.question_generator import create_question_generator_agent
from api.interview.agents.resume_parser import create_resume_parser_agent
from api.interview.agents.rubric_generator import create_rubric_generator_agent
from api.interview.agents.structure_composer import create_structure_composer_agent
from api.interview.state import InterviewState

logger = logging.getLogger(__name__)


def should_continue_after_orchestrator(
    state: InterviewState,
) -> Literal["parse_jd", "parse_resume", "__end__"]:
    """Route after orchestrator - if error, end; otherwise continue to parsers."""
    if state.get("error"):
        return END
    # Return both nodes for parallel execution
    return "parse_jd"


def should_continue_after_jd(state: InterviewState) -> Literal["wait_for_parsers", "__end__"]:
    """Route after JD parser."""
    if state.get("error"):
        return END
    return "wait_for_parsers"


def should_continue_after_resume(state: InterviewState) -> Literal["wait_for_parsers", "__end__"]:
    """Route after resume parser."""
    if state.get("error"):
        return END
    return "wait_for_parsers"


def should_continue_after_wait(state: InterviewState) -> Literal["matching", "__end__"]:
    """Route after waiting for both parsers."""
    if state.get("error"):
        return END
    # Check if both parsers completed
    if state.get("parsed_jd") and state.get("parsed_resume"):
        return "matching"
    return END


def should_continue_standard(state: InterviewState) -> Literal["__end__"]:
    """Standard continuation check - end on error."""
    if state.get("error"):
        return END
    return END  # This shouldn't be used with conditional edges


def build_interview_graph(
    checkpointer: BaseCheckpointSaver | None = None,
    provider: LLMProvider | None = None,
):
    """Build and compile the interview generator LangGraph.

    The graph structure:
    ```
    START → orchestrator → [jd_parser, resume_parser] (parallel)
                         → wait_for_parsers → matching → question_generator
                         → structure_composer → rubric_generator → finalize → END
    ```

    Args:
        checkpointer: Optional checkpoint saver for conversation persistence.
        provider: LLM provider to use. Defaults to settings.llm_provider.

    Returns:
        A compiled LangGraph CompiledGraph instance.
    """
    llm = build_llm(provider)

    # Create agent functions with the LLM
    jd_parser = create_jd_parser_agent(llm)
    resume_parser = create_resume_parser_agent(llm)
    matching = create_matching_agent(llm)
    question_generator = create_question_generator_agent(llm)
    structure_composer = create_structure_composer_agent(llm)
    rubric_generator = create_rubric_generator_agent(llm)

    # Synchronization node that waits for both parsers
    async def wait_for_parsers(state: InterviewState) -> dict:
        """Synchronization point - just pass through state."""
        logger.info("Wait node: Both parsers complete, continuing to matching")
        return {}

    # Build the graph
    graph = StateGraph(InterviewState)

    # Add all nodes
    graph.add_node("orchestrator", orchestrator_agent)
    graph.add_node("parse_jd", jd_parser)
    graph.add_node("parse_resume", resume_parser)
    graph.add_node("wait_for_parsers", wait_for_parsers)
    graph.add_node("matching", matching)
    graph.add_node("question_generator", question_generator)
    graph.add_node("structure_composer", structure_composer)
    graph.add_node("rubric_generator", rubric_generator)
    graph.add_node("finalize", finalize_agent)

    # Define edges
    # Start with orchestrator
    graph.add_edge(START, "orchestrator")

    # After orchestrator, fan out to both parsers (parallel execution)
    graph.add_conditional_edges(
        "orchestrator",
        should_continue_after_orchestrator,
        {
            "parse_jd": "parse_jd",
            END: END,
        },
    )

    # Also add edge to resume parser from orchestrator
    # LangGraph handles this by running both in parallel when we use fan-out
    graph.add_edge("orchestrator", "parse_resume")

    # Both parsers go to wait node (fan-in)
    graph.add_edge("parse_jd", "wait_for_parsers")
    graph.add_edge("parse_resume", "wait_for_parsers")

    # After wait, continue to matching
    graph.add_conditional_edges(
        "wait_for_parsers",
        should_continue_after_wait,
        {
            "matching": "matching",
            END: END,
        },
    )

    # Sequential flow for the rest
    graph.add_edge("matching", "question_generator")
    graph.add_edge("question_generator", "structure_composer")
    graph.add_edge("structure_composer", "rubric_generator")
    graph.add_edge("rubric_generator", "finalize")
    graph.add_edge("finalize", END)

    # Compile with optional checkpointer
    compile_kwargs: dict = {}
    if checkpointer is not None:
        compile_kwargs["checkpointer"] = checkpointer

    return graph.compile(**compile_kwargs)


# Agent name to display name mapping for progress updates
AGENT_DISPLAY_NAMES = {
    "orchestrator": "Input Validation",
    "parse_jd": "Parsing Job Description",
    "parse_resume": "Parsing Resume",
    "wait_for_parsers": "Synchronizing",
    "matching": "Analyzing Candidate Match",
    "question_generator": "Generating Questions",
    "structure_composer": "Structuring Interview",
    "rubric_generator": "Creating Scoring Rubric",
    "finalize": "Finalizing Package",
}
