"""Interview generator state and Pydantic models."""

from __future__ import annotations

from typing import Annotated, Literal, Optional

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

# ── Interview Type ────────────────────────────────────────────────────────────

InterviewType = Literal["technical", "culture_fit", "system_design", "leadership"]

INTERVIEW_TYPE_LABELS: dict[InterviewType, str] = {
    "technical": "Technical Interview",
    "culture_fit": "Culture Fit Interview",
    "system_design": "System Design Interview",
    "leadership": "Leadership Interview",
}


# ── Pydantic Models for Structured Output ─────────────────────────────────────


class Skill(BaseModel):
    """A skill extracted from JD or resume."""

    name: str = Field(..., description="Name of the skill")
    level: Optional[Literal["beginner", "intermediate", "advanced", "expert"]] = Field(
        default=None, description="Proficiency level if determinable"
    )
    years: Optional[int] = Field(default=None, description="Years of experience if mentioned")


class Requirement(BaseModel):
    """A requirement from the job description."""

    description: str = Field(..., description="The requirement description")
    category: Literal["must_have", "nice_to_have"] = Field(
        ..., description="Whether this is required or preferred"
    )
    skills: list[str] = Field(default_factory=list, description="Related skills")


class ParsedJD(BaseModel):
    """Parsed job description structure."""

    title: str = Field(..., description="Job title")
    level: Literal["junior", "mid", "senior", "lead", "principal", "manager", "director"] = Field(
        ..., description="Seniority level"
    )
    department: Optional[str] = Field(default=None, description="Department or team")
    requirements: list[Requirement] = Field(
        default_factory=list, description="Job requirements"
    )
    responsibilities: list[str] = Field(
        default_factory=list, description="Key responsibilities"
    )
    tech_stack: list[str] = Field(
        default_factory=list, description="Technologies and tools mentioned"
    )
    soft_skills: list[str] = Field(
        default_factory=list, description="Soft skills required"
    )
    domain_knowledge: list[str] = Field(
        default_factory=list, description="Domain/industry knowledge required"
    )


class Experience(BaseModel):
    """Work experience entry from resume."""

    company: str = Field(..., description="Company name")
    title: str = Field(..., description="Job title")
    duration: Optional[str] = Field(default=None, description="Duration (e.g., '2 years')")
    highlights: list[str] = Field(default_factory=list, description="Key achievements")
    technologies: list[str] = Field(default_factory=list, description="Technologies used")


class Education(BaseModel):
    """Education entry from resume."""

    degree: str = Field(..., description="Degree name")
    institution: str = Field(..., description="School/university name")
    year: Optional[str] = Field(default=None, description="Graduation year or period")
    field: Optional[str] = Field(default=None, description="Field of study")


class ParsedResume(BaseModel):
    """Parsed resume structure."""

    name: Optional[str] = Field(default=None, description="Candidate name")
    current_title: Optional[str] = Field(default=None, description="Current job title")
    years_experience: Optional[int] = Field(
        default=None, description="Total years of experience"
    )
    skills: list[Skill] = Field(default_factory=list, description="Technical skills")
    experiences: list[Experience] = Field(default_factory=list, description="Work history")
    education: list[Education] = Field(default_factory=list, description="Education background")
    certifications: list[str] = Field(default_factory=list, description="Certifications")
    projects: list[str] = Field(default_factory=list, description="Notable projects")
    summary: Optional[str] = Field(default=None, description="Professional summary")


class SkillGap(BaseModel):
    """A gap between job requirements and candidate skills."""

    skill: str = Field(..., description="Skill with a gap")
    required_level: str = Field(..., description="Level required by JD")
    candidate_level: Optional[str] = Field(
        default=None, description="Candidate's current level"
    )
    gap_severity: Literal["minor", "moderate", "significant"] = Field(
        ..., description="How significant the gap is"
    )
    interview_focus: str = Field(..., description="What to probe in interview")


class Strength(BaseModel):
    """A candidate strength relevant to the role."""

    area: str = Field(..., description="Area of strength")
    evidence: str = Field(..., description="Evidence from resume")
    relevance: str = Field(..., description="How it applies to the role")


class GapAnalysis(BaseModel):
    """Analysis of match between JD and resume."""

    overall_match_score: int = Field(
        ..., ge=0, le=100, description="Overall match percentage"
    )
    skill_gaps: list[SkillGap] = Field(default_factory=list, description="Identified gaps")
    strengths: list[Strength] = Field(default_factory=list, description="Candidate strengths")
    focus_areas: list[str] = Field(
        default_factory=list, description="Recommended interview focus areas"
    )
    risk_factors: list[str] = Field(
        default_factory=list, description="Potential concerns to address"
    )
    recommendations: list[str] = Field(
        default_factory=list, description="Interview recommendations"
    )


class Question(BaseModel):
    """An interview question."""

    id: str = Field(..., description="Unique question identifier")
    question: str = Field(..., description="The question text")
    category: str = Field(..., description="Question category (e.g., 'technical', 'behavioral')")
    subcategory: Optional[str] = Field(default=None, description="Specific area")
    difficulty: Literal["easy", "medium", "hard"] = Field(..., description="Difficulty level")
    time_minutes: int = Field(..., ge=1, le=60, description="Expected time to answer")
    follow_ups: list[str] = Field(default_factory=list, description="Follow-up questions")
    what_to_look_for: list[str] = Field(
        default_factory=list, description="Key things to evaluate in answer"
    )
    red_flags: list[str] = Field(
        default_factory=list, description="Warning signs in candidate response"
    )
    related_gap: Optional[str] = Field(
        default=None, description="Related skill gap being probed"
    )


class InterviewSection(BaseModel):
    """A section of the interview."""

    name: str = Field(..., description="Section name")
    duration_minutes: int = Field(..., ge=1, description="Section duration")
    description: str = Field(..., description="Section purpose")
    question_ids: list[str] = Field(default_factory=list, description="Questions for this section")
    interviewer_notes: list[str] = Field(
        default_factory=list, description="Notes for the interviewer"
    )


class ScoringCriterion(BaseModel):
    """A criterion for scoring candidate responses."""

    criterion: str = Field(..., description="What to evaluate")
    weight: int = Field(..., ge=1, le=10, description="Importance weight (1-10)")
    indicators: dict[str, str] = Field(
        default_factory=dict,
        description="Score indicators: {1: 'poor', 3: 'adequate', 5: 'excellent'}",
    )


class ScoringArea(BaseModel):
    """A scoring area with multiple criteria."""

    area: str = Field(..., description="Area name (e.g., 'Technical Skills')")
    weight: int = Field(..., ge=1, le=100, description="Area weight percentage")
    criteria: list[ScoringCriterion] = Field(default_factory=list, description="Criteria")
    pass_threshold: int = Field(
        default=3, ge=1, le=5, description="Minimum score to pass this area"
    )


class InterviewGuidance(BaseModel):
    """Additional guidance for the interviewer."""

    opening_script: str = Field(..., description="How to open the interview")
    closing_script: str = Field(..., description="How to close the interview")
    time_management_tips: list[str] = Field(default_factory=list, description="Time tips")
    candidate_specific_notes: list[str] = Field(
        default_factory=list, description="Notes specific to this candidate"
    )


class InterviewPackage(BaseModel):
    """Complete interview package output."""

    thread_id: str = Field(..., description="Unique thread identifier")
    interview_type: InterviewType = Field(..., description="Type of interview")
    total_duration_minutes: int = Field(..., description="Total interview duration")
    parsed_jd: ParsedJD = Field(..., description="Parsed job description")
    parsed_resume: ParsedResume = Field(..., description="Parsed resume")
    gap_analysis: GapAnalysis = Field(..., description="Gap analysis")
    questions: list[Question] = Field(..., description="All questions")
    structure: list[InterviewSection] = Field(..., description="Interview structure")
    rubric: list[ScoringArea] = Field(..., description="Scoring rubric")
    guidance: InterviewGuidance = Field(..., description="Interviewer guidance")


# ── LangGraph State ───────────────────────────────────────────────────────────


class InterviewState(TypedDict):
    """State shared across all nodes in the interview generator graph."""

    messages: Annotated[list[BaseMessage], add_messages]
    """Conversation message history, automatically merged by LangGraph."""

    # ── Inputs ────────────────────────────────────────────────────────────────
    job_description: str
    """Raw job description text."""

    resume_text: str
    """Extracted text from resume PDF."""

    interview_type: InterviewType
    """Type of interview to generate."""

    # ── Agent outputs ─────────────────────────────────────────────────────────
    parsed_jd: Optional[ParsedJD]
    """Output from JD Parser agent."""

    parsed_resume: Optional[ParsedResume]
    """Output from Resume Parser agent."""

    gap_analysis: Optional[GapAnalysis]
    """Output from Matching agent."""

    questions: Optional[list[Question]]
    """Output from Question Generator agent."""

    interview_structure: Optional[list[InterviewSection]]
    """Output from Structure Composer agent."""

    rubric: Optional[list[ScoringArea]]
    """Output from Rubric Generator agent."""

    guidance: Optional[InterviewGuidance]
    """Output from final orchestrator compilation."""

    error: Optional[str]
    """Error message if any agent failed."""
