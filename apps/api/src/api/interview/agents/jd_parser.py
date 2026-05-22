"""Job Description Parser agent."""

from __future__ import annotations

import logging

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage

from api.interview.prompts import JD_PARSER_PROMPT
from api.interview.state import InterviewState, ParsedJD

logger = logging.getLogger(__name__)


def create_jd_parser_agent(llm: BaseChatModel):
    """Create the JD parser agent function with the given LLM."""

    # Bind structured output to the LLM
    structured_llm = llm.with_structured_output(ParsedJD)

    async def jd_parser_agent(state: InterviewState) -> dict:
        """Parse the job description to extract structured requirements."""
        logger.info("JD Parser: Starting job description analysis")

        job_description = state.get("job_description", "")

        prompt = JD_PARSER_PROMPT.format(job_description=job_description)

        try:
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])

            logger.info(f"JD Parser: Extracted {len(result.requirements)} requirements")

            msg = (
                f"Job description parsed: {result.title} ({result.level} level) "
                f"with {len(result.requirements)} requirements and "
                f"{len(result.tech_stack)} technologies."
            )
            return {
                "parsed_jd": result,
                "messages": [AIMessage(content=msg)],
            }

        except Exception as exc:
            logger.exception("JD Parser: Failed to parse job description")
            return {
                "error": f"JD parsing failed: {exc}",
                "messages": [AIMessage(content=f"Failed to parse job description: {exc}")],
            }

    return jd_parser_agent


# Default export for when LLM is passed separately
async def jd_parser_agent(state: InterviewState) -> dict:
    """Placeholder - actual agent is created with create_jd_parser_agent."""
    raise NotImplementedError("Use create_jd_parser_agent with an LLM instance")
