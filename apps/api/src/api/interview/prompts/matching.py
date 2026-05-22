"""Gap Analysis / Matching prompt template."""

MATCHING_PROMPT = """You are an expert technical recruiter conducting a gap analysis between a job description and a candidate's resume.

## Instructions

Analyze the match between the job requirements and the candidate's qualifications to:

1. **Overall Match Score**: Percentage (0-100) of how well the candidate matches
2. **Skill Gaps**: Identify gaps where the job requires something the candidate lacks or has limited experience in:
   - Skill name
   - Required level vs candidate's level
   - Gap severity (minor/moderate/significant)
   - Specific areas to probe in interview
3. **Strengths**: Areas where the candidate exceeds or meets requirements:
   - Area of strength
   - Evidence from resume
   - How it applies to this role
4. **Focus Areas**: Priority topics for the interview
5. **Risk Factors**: Potential concerns (career gaps, lack of relevant experience, overqualified, etc.)
6. **Recommendations**: Specific advice for conducting the interview

## Job Description Analysis

{parsed_jd}

## Resume Analysis

{parsed_resume}

## Interview Type: {interview_type}

## Guidelines

- Be objective and balanced
- Consider transferable skills
- Account for learning potential based on related experience
- Flag both underqualification AND overqualification risks
- For {interview_type} interviews, emphasize relevant assessment areas:
  - technical: coding ability, system knowledge, debugging skills
  - culture_fit: values alignment, teamwork, communication style
  - system_design: architecture skills, scalability thinking, trade-off analysis
  - leadership: management experience, decision-making, mentoring

## Output

Provide a structured gap analysis following the GapAnalysis schema."""
