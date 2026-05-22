"""Resume Parser agent."""

from __future__ import annotations

import logging

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage

from api.interview.prompts import RESUME_PARSER_PROMPT
from api.interview.state import InterviewState, ParsedResume

logger = logging.getLogger(__name__)


def create_resume_parser_agent(llm: BaseChatModel):
    """Create the resume parser agent function with the given LLM."""

    structured_llm = llm.with_structured_output(ParsedResume)

    async def resume_parser_agent(state: InterviewState) -> dict:
        """Parse the resume to extract candidate information."""
        logger.info("Resume Parser: Starting resume analysis")

        resume_text = state.get("resume_text", "")

        prompt = RESUME_PARSER_PROMPT.format(resume_text=resume_text)

        try:
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])

            logger.info(
                f"Resume Parser: Extracted {len(result.skills)} skills, "
                f"{len(result.experiences)} experiences"
            )

            name = result.name or "Candidate"
            yrs = result.years_experience or "N/A"
            msg = f"Resume parsed: {name} ({yrs} yrs), {len(result.skills)} skills."
            return {
                "parsed_resume": result,
                "messages": [AIMessage(content=msg)],
            }

        except Exception as exc:
            logger.exception("Resume Parser: Failed to parse resume")
            return {
                "error": f"Resume parsing failed: {exc}",
                "messages": [AIMessage(content=f"Failed to parse resume: {exc}")],
            }

    return resume_parser_agent


async def resume_parser_agent(state: InterviewState) -> dict:
    """Placeholder - actual agent is created with create_resume_parser_agent."""
    raise NotImplementedError("Use create_resume_parser_agent with an LLM instance")
