"""Interview Structure Composer agent."""

from __future__ import annotations

import json
import logging

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field

from api.interview.prompts import STRUCTURE_COMPOSER_PROMPT
from api.interview.state import InterviewSection, InterviewState

logger = logging.getLogger(__name__)


# Default interview durations by type (in minutes)
INTERVIEW_DURATIONS = {
    "technical": 60,
    "culture_fit": 45,
    "system_design": 90,
    "leadership": 60,
}


class InterviewStructure(BaseModel):
    """Container for interview sections."""

    sections: list[InterviewSection] = Field(..., description="Interview sections")


def create_structure_composer_agent(llm: BaseChatModel):
    """Create the structure composer agent function with the given LLM."""

    structured_llm = llm.with_structured_output(InterviewStructure)

    async def structure_composer_agent(state: InterviewState) -> dict:
        """Organize questions into a structured interview flow."""
        logger.info("Structure Composer: Starting interview structuring")

        parsed_jd = state.get("parsed_jd")
        gap_analysis = state.get("gap_analysis")
        questions = state.get("questions")
        interview_type = state.get("interview_type", "technical")

        if not parsed_jd or not gap_analysis or not questions:
            error_msg = "Cannot compose structure: Previous analysis incomplete"
            logger.error(f"Structure Composer: {error_msg}")
            return {
                "error": error_msg,
                "messages": [AIMessage(content=error_msg)],
            }

        duration_minutes = INTERVIEW_DURATIONS.get(interview_type, 60)

        # Serialize questions for the prompt
        questions_data = [
            {
                "id": q.id,
                "question": q.question[:100] + "..." if len(q.question) > 100 else q.question,
                "category": q.category,
                "difficulty": q.difficulty,
                "time_minutes": q.time_minutes,
            }
            for q in questions
        ]
        questions_json = json.dumps(questions_data, indent=2)

        gap_summary = f"""
Focus Areas: {', '.join(gap_analysis.focus_areas)}
Key Gaps: {', '.join([g.skill for g in gap_analysis.skill_gaps[:5]])}
Recommendations: {'; '.join(gap_analysis.recommendations[:3])}
"""

        prompt = STRUCTURE_COMPOSER_PROMPT.format(
            interview_type=interview_type,
            duration_minutes=duration_minutes,
            seniority_level=parsed_jd.level,
            questions_json=questions_json,
            gap_summary=gap_summary,
        )

        try:
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])

            sections = result.sections
            total_time = sum(s.duration_minutes for s in sections)

            logger.info(
                f"Structure Composer: Created {len(sections)} sections, "
                f"total {total_time} minutes"
            )

            msg = f"Interview: {len(sections)} sections, {total_time} minutes total."
            return {
                "interview_structure": sections,
                "messages": [AIMessage(content=msg)],
            }

        except Exception as exc:
            logger.exception("Structure Composer: Failed to compose structure")
            return {
                "error": f"Structure composition failed: {exc}",
                "messages": [AIMessage(content=f"Failed to compose interview structure: {exc}")],
            }

    return structure_composer_agent


async def structure_composer_agent(state: InterviewState) -> dict:
    """Placeholder - actual agent is created with create_structure_composer_agent."""
    raise NotImplementedError("Use create_structure_composer_agent with an LLM instance")
