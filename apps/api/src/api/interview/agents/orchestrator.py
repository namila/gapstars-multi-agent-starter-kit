"""Orchestrator agent for input validation and final compilation."""

from __future__ import annotations

import logging

from langchain_core.messages import AIMessage

from api.interview.state import InterviewGuidance, InterviewState

logger = logging.getLogger(__name__)


async def orchestrator_agent(state: InterviewState) -> dict:
    """Validate inputs and initialize the agent pipeline.

    This agent runs first to ensure we have valid inputs before
    dispatching to the parser agents.
    """
    logger.info("Orchestrator: Validating inputs")

    job_description = state.get("job_description", "")
    resume_text = state.get("resume_text", "")
    interview_type = state.get("interview_type", "technical")

    errors = []

    if not job_description or len(job_description.strip()) < 50:
        errors.append("Job description is too short (minimum 50 characters)")

    if not resume_text or len(resume_text.strip()) < 50:
        errors.append("Resume text is too short (minimum 50 characters)")

    if interview_type not in ("technical", "culture_fit", "system_design", "leadership"):
        errors.append(f"Invalid interview type: {interview_type}")

    if errors:
        error_message = "Validation errors: " + "; ".join(errors)
        logger.error(f"Orchestrator: {error_message}")
        return {
            "error": error_message,
            "messages": [AIMessage(content=f"Input validation failed: {error_message}")],
        }

    logger.info("Orchestrator: Inputs validated successfully")
    return {
        "messages": [AIMessage(content="Input validation complete. Starting analysis...")],
    }


async def finalize_agent(state: InterviewState) -> dict:
    """Compile final interview guidance after all agents complete.

    This agent runs last to generate interviewer guidance based on
    all the collected information.
    """
    logger.info("Finalizer: Compiling interview guidance")

    parsed_jd = state.get("parsed_jd")
    parsed_resume = state.get("parsed_resume")
    gap_analysis = state.get("gap_analysis")
    interview_type = state.get("interview_type", "technical")

    # Generate opening script
    if parsed_resume and parsed_resume.name:
        candidate_name = parsed_resume.name
    else:
        candidate_name = "the candidate"
    job_title = parsed_jd.title if parsed_jd else "this position"

    opening_script = (
        f"Welcome, {candidate_name}. Thank you for taking the time to speak "
        f"with us today about the {job_title} position.\n\n"
        "Before we begin, I'd like to give you a brief overview of what we'll "
        "cover today. We'll spend about [duration] minutes together, starting "
        "with some questions about your background and experience, then moving "
        "into more specific [interview_type] discussions. At the end, you'll "
        "have time to ask any questions you have about the role or the team.\n\n"
        "Feel free to ask for clarification if any question isn't clear, and "
        "take your time with your responses. Ready to get started?"
    )

    # Generate closing script
    closing_script = (
        "Thank you for your thoughtful responses today. Before we wrap up, "
        "do you have any questions for me about the role, team, or company?\n\n"
        "[After candidate questions]\n\n"
        "Great questions. Here's what happens next: Our team will review all "
        "candidates and you should hear back from us within [timeframe]. If you "
        "think of any other questions in the meantime, feel free to reach out "
        "to your recruiter.\n\n"
        "Thank you again for your time today, and best of luck!"
    )

    # Time management tips
    time_tips = [
        "Keep an eye on the clock - skip optional questions rather than rushing",
        "If answers run long, gently redirect: 'That's helpful. Let's move to...'",
        "Allow natural pauses - candidates often elaborate after a moment of thought",
        "Save 5 minutes at the end for candidate questions and closing",
    ]

    # Candidate-specific notes
    candidate_notes = []

    if parsed_resume and parsed_resume.current_title:
        candidate_notes.append(
            f"Currently working as {parsed_resume.current_title} - acknowledge this"
        )

    if gap_analysis:
        if gap_analysis.skill_gaps:
            top_gaps = [g.skill for g in gap_analysis.skill_gaps[:3]]
            candidate_notes.append(
                f"Key areas to probe: {', '.join(top_gaps)}"
            )

        if gap_analysis.strengths:
            top_strengths = [s.area for s in gap_analysis.strengths[:2]]
            candidate_notes.append(
                f"Leverage their strengths in: {', '.join(top_strengths)}"
            )

        if gap_analysis.risk_factors:
            candidate_notes.append(
                f"Address potential concerns: {'; '.join(gap_analysis.risk_factors[:2])}"
            )

    guidance = InterviewGuidance(
        opening_script=opening_script.replace("[interview_type]", interview_type.replace("_", " ")),
        closing_script=closing_script,
        time_management_tips=time_tips,
        candidate_specific_notes=candidate_notes,
    )

    logger.info("Finalizer: Interview guidance compiled successfully")

    return {
        "guidance": guidance,
        "messages": [
            AIMessage(content="Interview package complete. Your interview guide is ready.")
        ],
    }
