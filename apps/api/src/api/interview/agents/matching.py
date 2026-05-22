"""Gap Analysis / Matching agent."""

from __future__ import annotations

import logging

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage

from api.interview.prompts import MATCHING_PROMPT
from api.interview.state import GapAnalysis, InterviewState

logger = logging.getLogger(__name__)


def create_matching_agent(llm: BaseChatModel):
    """Create the matching/gap analysis agent function with the given LLM."""

    structured_llm = llm.with_structured_output(GapAnalysis)

    async def matching_agent(state: InterviewState) -> dict:
        """Analyze the match between JD requirements and candidate qualifications."""
        logger.info("Matching Agent: Starting gap analysis")

        parsed_jd = state.get("parsed_jd")
        parsed_resume = state.get("parsed_resume")
        interview_type = state.get("interview_type", "technical")

        if not parsed_jd or not parsed_resume:
            error_msg = "Cannot perform matching: JD or Resume parsing incomplete"
            logger.error(f"Matching Agent: {error_msg}")
            return {
                "error": error_msg,
                "messages": [AIMessage(content=error_msg)],
            }

        # Serialize parsed data for the prompt
        parsed_jd_json = parsed_jd.model_dump_json(indent=2)
        parsed_resume_json = parsed_resume.model_dump_json(indent=2)

        prompt = MATCHING_PROMPT.format(
            parsed_jd=parsed_jd_json,
            parsed_resume=parsed_resume_json,
            interview_type=interview_type,
        )

        try:
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])

            logger.info(
                f"Matching Agent: Match score {result.overall_match_score}%, "
                f"{len(result.skill_gaps)} gaps, {len(result.strengths)} strengths"
            )

            msg = (
                f"Gap analysis complete: {result.overall_match_score}% match with "
                f"{len(result.skill_gaps)} skill gaps and {len(result.strengths)} "
                "strengths identified."
            )
            return {
                "gap_analysis": result,
                "messages": [AIMessage(content=msg)],
            }

        except Exception as exc:
            logger.exception("Matching Agent: Failed to perform gap analysis")
            return {
                "error": f"Gap analysis failed: {exc}",
                "messages": [AIMessage(content=f"Failed to perform gap analysis: {exc}")],
            }

    return matching_agent


async def matching_agent(state: InterviewState) -> dict:
    """Placeholder - actual agent is created with create_matching_agent."""
    raise NotImplementedError("Use create_matching_agent with an LLM instance")
