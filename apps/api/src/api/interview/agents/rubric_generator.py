"""Scoring Rubric Generator agent."""

from __future__ import annotations

import logging

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field

from api.interview.prompts import RUBRIC_GENERATOR_PROMPT
from api.interview.state import InterviewState, ScoringArea

logger = logging.getLogger(__name__)


class ScoringRubric(BaseModel):
    """Container for scoring areas."""

    areas: list[ScoringArea] = Field(..., description="Scoring areas")


def create_rubric_generator_agent(llm: BaseChatModel):
    """Create the rubric generator agent function with the given LLM."""

    structured_llm = llm.with_structured_output(ScoringRubric)

    async def rubric_generator_agent(state: InterviewState) -> dict:
        """Generate a comprehensive scoring rubric for the interview."""
        logger.info("Rubric Generator: Starting rubric generation")

        parsed_jd = state.get("parsed_jd")
        gap_analysis = state.get("gap_analysis")
        interview_structure = state.get("interview_structure")
        interview_type = state.get("interview_type", "technical")

        if not parsed_jd or not gap_analysis or not interview_structure:
            error_msg = "Cannot generate rubric: Previous analysis incomplete"
            logger.error(f"Rubric Generator: {error_msg}")
            return {
                "error": error_msg,
                "messages": [AIMessage(content=error_msg)],
            }

        # Create summaries for the prompt
        must_have = [r.description for r in parsed_jd.requirements if r.category == "must_have"]
        jd_summary = f"""
Title: {parsed_jd.title}
Level: {parsed_jd.level}
Tech Stack: {', '.join(parsed_jd.tech_stack[:8])}
Key Requirements: {'; '.join(must_have[:5])}
Soft Skills: {', '.join(parsed_jd.soft_skills[:5])}
"""

        focus_areas = ", ".join(gap_analysis.focus_areas)

        sections_summary = "\n".join(
            [f"- {s.name} ({s.duration_minutes} min): {s.description}" for s in interview_structure]
        )

        prompt = RUBRIC_GENERATOR_PROMPT.format(
            interview_type=interview_type,
            job_title=parsed_jd.title,
            seniority_level=parsed_jd.level,
            jd_summary=jd_summary,
            focus_areas=focus_areas,
            sections_summary=sections_summary,
        )

        try:
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])

            areas = result.areas

            # Validate weights sum to ~100
            total_weight = sum(a.weight for a in areas)
            if total_weight != 100:
                logger.warning(
                    f"Rubric weights sum to {total_weight}%, normalizing to 100%"
                )
                # Normalize weights
                for area in areas:
                    area.weight = int(area.weight * 100 / total_weight)

            logger.info(
                f"Rubric Generator: Created {len(areas)} scoring areas with "
                f"{sum(len(a.criteria) for a in areas)} total criteria"
            )

            area_names = ", ".join([a.area for a in areas])
            msg = f"Scoring rubric: {len(areas)} areas ({area_names})."
            return {
                "rubric": areas,
                "messages": [AIMessage(content=msg)],
            }

        except Exception as exc:
            logger.exception("Rubric Generator: Failed to generate rubric")
            return {
                "error": f"Rubric generation failed: {exc}",
                "messages": [AIMessage(content=f"Failed to generate scoring rubric: {exc}")],
            }

    return rubric_generator_agent


async def rubric_generator_agent(state: InterviewState) -> dict:
    """Placeholder - actual agent is created with create_rubric_generator_agent."""
    raise NotImplementedError("Use create_rubric_generator_agent with an LLM instance")
