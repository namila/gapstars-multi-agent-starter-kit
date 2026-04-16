from __future__ import annotations

from typing import Literal

from langchain_core.language_models import BaseChatModel
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from api.agent.state import AgentState
from api.agent.tools import TOOLS
from api.config import LLMProvider, settings


def build_llm(provider: LLMProvider | None = None) -> BaseChatModel:
    """Instantiate the appropriate chat model for *provider*.

    Falls back to ``settings.llm_provider`` when *provider* is ``None``.
    Raises ``ValueError`` with a user-friendly message when the required API
    key for the requested provider is not configured.
    """
    resolved: LLMProvider = provider or settings.llm_provider

    if resolved == "openai":
        if not settings.openai_api_key:
            raise ValueError(
                "OPENAI_API_KEY is not configured. "
                "Set it in your .env file to use the OpenAI provider."
            )
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            streaming=True,
        )

    if resolved == "mistral":
        if not settings.mistral_api_key:
            raise ValueError(
                "MISTRAL_API_KEY is not configured. "
                "Set it in your .env file to use the Mistral provider."
            )
        from langchain_mistralai import ChatMistralAI

        return ChatMistralAI(
            model=settings.mistral_model,
            api_key=settings.mistral_api_key,  # type: ignore[arg-type]
            streaming=True,
        )

    raise ValueError(f"Unknown LLM provider: {resolved!r}")


def build_graph(
    checkpointer: BaseCheckpointSaver | None = None,
    provider: LLMProvider | None = None,
):
    """Build and compile the ReAct-style LangGraph agent graph.

    Args:
        checkpointer: Optional checkpoint saver for persistent conversation state.
        provider: LLM provider to use. Defaults to ``settings.llm_provider``.

    Returns:
        A compiled LangGraph ``CompiledGraph`` instance.
    """
    llm = build_llm(provider)
    llm_with_tools = llm.bind_tools(TOOLS)

    # ── Nodes ────────────────────────────────────────────────────────────────

    async def call_model(state: AgentState) -> AgentState:
        """Invoke the LLM with the current message history."""
        response = await llm_with_tools.ainvoke(state["messages"])
        return {"messages": [response]}

    tool_node = ToolNode(TOOLS)

    # ── Conditional routing ──────────────────────────────────────────────────

    def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
        """Route to tools if the last message contains tool calls, else end."""
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END

    # ── Graph definition ─────────────────────────────────────────────────────

    graph = StateGraph(AgentState)
    graph.add_node("call_model", call_model)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "call_model")
    graph.add_conditional_edges("call_model", should_continue, ["tools", END])
    graph.add_edge("tools", "call_model")

    compile_kwargs: dict = {}
    if checkpointer is not None:
        compile_kwargs["checkpointer"] = checkpointer

    return graph.compile(**compile_kwargs)
