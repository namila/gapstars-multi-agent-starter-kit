/**
 * Interview generator type definitions
 */

export type InterviewType = "technical" | "culture_fit" | "system_design" | "leadership"

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  technical: "Technical Interview",
  culture_fit: "Culture Fit Interview",
  system_design: "System Design Interview",
  leadership: "Leadership Interview",
}

export const INTERVIEW_TYPE_DESCRIPTIONS: Record<InterviewType, string> = {
  technical: "Assess coding skills, technical knowledge, and problem-solving abilities",
  culture_fit: "Evaluate alignment with company values, teamwork, and communication",
  system_design: "Test architecture skills, scalability thinking, and trade-off analysis",
  leadership: "Assess management experience, decision-making, and team leadership",
}

// ── Parsed JD ────────────────────────────────────────────────────────────────

export interface Skill {
  name: string
  level?: "beginner" | "intermediate" | "advanced" | "expert"
  years?: number
}

export interface Requirement {
  description: string
  category: "must_have" | "nice_to_have"
  skills: string[]
}

export interface ParsedJD {
  title: string
  level: "junior" | "mid" | "senior" | "lead" | "principal" | "manager" | "director"
  department?: string
  requirements: Requirement[]
  responsibilities: string[]
  tech_stack: string[]
  soft_skills: string[]
  domain_knowledge: string[]
}

// ── Parsed Resume ────────────────────────────────────────────────────────────

export interface Experience {
  company: string
  title: string
  duration?: string
  highlights: string[]
  technologies: string[]
}

export interface Education {
  degree: string
  institution: string
  year?: string
  field?: string
}

export interface ParsedResume {
  name?: string
  current_title?: string
  years_experience?: number
  skills: Skill[]
  experiences: Experience[]
  education: Education[]
  certifications: string[]
  projects: string[]
  summary?: string
}

// ── Gap Analysis ─────────────────────────────────────────────────────────────

export interface SkillGap {
  skill: string
  required_level: string
  candidate_level?: string
  gap_severity: "minor" | "moderate" | "significant"
  interview_focus: string
}

export interface Strength {
  area: string
  evidence: string
  relevance: string
}

export interface GapAnalysis {
  overall_match_score: number
  skill_gaps: SkillGap[]
  strengths: Strength[]
  focus_areas: string[]
  risk_factors: string[]
  recommendations: string[]
}

// ── Questions ────────────────────────────────────────────────────────────────

export interface Question {
  id: string
  question: string
  category: string
  subcategory?: string
  difficulty: "easy" | "medium" | "hard"
  time_minutes: number
  follow_ups: string[]
  what_to_look_for: string[]
  red_flags: string[]
  related_gap?: string
}

// ── Interview Structure ──────────────────────────────────────────────────────

export interface InterviewSection {
  name: string
  duration_minutes: number
  description: string
  question_ids: string[]
  interviewer_notes: string[]
}

// ── Scoring Rubric ───────────────────────────────────────────────────────────

export interface ScoringCriterion {
  criterion: string
  weight: number
  indicators: Record<string, string>
}

export interface ScoringArea {
  area: string
  weight: number
  criteria: ScoringCriterion[]
  pass_threshold: number
}

// ── Interview Guidance ───────────────────────────────────────────────────────

export interface InterviewGuidance {
  opening_script: string
  closing_script: string
  time_management_tips: string[]
  candidate_specific_notes: string[]
}

// ── Complete Package ─────────────────────────────────────────────────────────

export interface InterviewPackage {
  thread_id: string
  interview_type: InterviewType
  total_duration_minutes: number
  parsed_jd: ParsedJD
  parsed_resume: ParsedResume
  gap_analysis: GapAnalysis
  questions: Question[]
  structure: InterviewSection[]
  rubric: ScoringArea[]
  guidance: InterviewGuidance
}

// ── SSE Events ───────────────────────────────────────────────────────────────

export interface AgentProgressEvent {
  agent: string
  display_name: string
  status: "running" | "completed" | "error"
  message?: string
}

export interface InterviewResultEvent {
  thread_id: string
  provider: string
  package: InterviewPackage
}

export interface InterviewErrorEvent {
  detail: string
}

export type InterviewStreamChunk =
  | { type: "progress"; data: AgentProgressEvent }
  | { type: "result"; data: InterviewResultEvent }
  | { type: "error"; data: InterviewErrorEvent }
  | { type: "done"; data: { thread_id: string; provider: string } }

// ── Agent Status Tracking ────────────────────────────────────────────────────

export const AGENT_ORDER = [
  "orchestrator",
  "parse_jd",
  "parse_resume",
  "matching",
  "question_generator",
  "structure_composer",
  "rubric_generator",
  "finalize",
] as const

export type AgentName = (typeof AGENT_ORDER)[number]

export const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  orchestrator: "Input Validation",
  parse_jd: "Parsing Job Description",
  parse_resume: "Parsing Resume",
  matching: "Analyzing Candidate Match",
  question_generator: "Generating Questions",
  structure_composer: "Structuring Interview",
  rubric_generator: "Creating Scoring Rubric",
  finalize: "Finalizing Package",
}

export type AgentStatus = "pending" | "running" | "completed" | "error"

export interface AgentStatusMap {
  [agent: string]: {
    status: AgentStatus
    message?: string
  }
}
