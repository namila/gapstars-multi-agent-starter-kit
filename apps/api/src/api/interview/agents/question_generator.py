"""Question Generator agent."""

from __future__ import annotations

import logging
import uuid

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field

from api.interview.prompts import QUESTION_GENERATOR_PROMPT
from api.interview.state import InterviewState, Question

logger = logging.getLogger(__name__)


class QuestionList(BaseModel):
    """Container for generated questions."""

    questions: list[Question] = Field(..., description="List of interview questions")


def create_question_generator_agent(llm: BaseChatModel):
    """Create the question generator agent function with the given LLM."""

    structured_llm = llm.with_structured_output(QuestionList)

    async def question_generator_agent(state: InterviewState) -> dict:
        """Generate tailored interview questions based on all collected information."""
        logger.info("Question Generator: Starting question generation")

        parsed_jd = state.get("parsed_jd")
        parsed_resume = state.get("parsed_resume")
        gap_analysis = state.get("gap_analysis")
        interview_type = state.get("interview_type", "technical")

        if not parsed_jd or not parsed_resume or not gap_analysis:
            error_msg = "Cannot generate questions: Previous analysis incomplete"
            logger.error(f"Question Generator: {error_msg}")
            return {
                "error": error_msg,
                "messages": [AIMessage(content=error_msg)],
            }

        # Create summaries for the prompt
        jd_summary = f"""
Title: {parsed_jd.title}
Level: {parsed_jd.level}
Tech Stack: {', '.join(parsed_jd.tech_stack[:10])}
Key Requirements: {'; '.join([r.description for r in parsed_jd.requirements[:5]])}
Soft Skills: {', '.join(parsed_jd.soft_skills[:5])}
"""

        exp = parsed_resume.experiences
        recent_title = exp[0].title if exp else "N/A"
        recent_company = exp[0].company if exp else "N/A"
        resume_summary = f"""
Name: {parsed_resume.name or 'Not specified'}
Current Title: {parsed_resume.current_title or 'Not specified'}
Years Experience: {parsed_resume.years_experience or 'Not specified'}
Key Skills: {', '.join([s.name for s in parsed_resume.skills[:10]])}
Recent Role: {recent_title} at {recent_company}
"""

        gap_summary = f"""
Match Score: {gap_analysis.overall_match_score}%
Skill Gaps: {'; '.join([f"{g.skill} ({g.gap_severity})" for g in gap_analysis.skill_gaps[:5]])}
Strengths: {'; '.join([s.area for s in gap_analysis.strengths[:3]])}
Focus Areas: {', '.join(gap_analysis.focus_areas[:5])}
Risk Factors: {'; '.join(gap_analysis.risk_factors[:3])}
"""

        prompt = QUESTION_GENERATOR_PROMPT.format(
            interview_type=interview_type,
            job_title=parsed_jd.title,
            seniority_level=parsed_jd.level,
            jd_summary=jd_summary,
            resume_summary=resume_summary,
            gap_analysis=gap_summary,
        )

        try:
            result = await structured_llm.ainvoke([HumanMessage(content=prompt)])

            # Ensure all questions have unique IDs
            questions = result.questions
            for i, q in enumerate(questions):
                if not q.id or q.id.startswith("q"):
                    q.id = f"q{i+1:02d}_{uuid.uuid4().hex[:6]}"

            logger.info(f"Question Generator: Generated {len(questions)} questions")

            # Group questions by category for summary
            categories = {}
            for q in questions:
                categories[q.category] = categories.get(q.category, 0) + 1
            category_summary = ", ".join([f"{k}: {v}" for k, v in categories.items()])

            msg = f"Generated {len(questions)} questions ({category_summary})."
            return {
                "questions": questions,
                "messages": [AIMessage(content=msg)],
            }

        except Exception as exc:
            logger.exception("Question Generator: Failed to generate questions")
            return {
                "error": f"Question generation failed: {exc}",
                "messages": [AIMessage(content=f"Failed to generate questions: {exc}")],
            }

    return question_generator_agent


async def question_generator_agent(state: InterviewState) -> dict:
    """Placeholder - actual agent is created with create_question_generator_agent."""
    raise NotImplementedError("Use create_question_generator_agent with an LLM instance")
