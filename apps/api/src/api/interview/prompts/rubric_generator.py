"""Scoring Rubric Generator prompt template."""

RUBRIC_GENERATOR_PROMPT = """You are an expert in designing interview evaluation rubrics. Create a comprehensive scoring system for this interview.

## Context

**Interview Type**: {interview_type}
**Job Title**: {job_title}
**Seniority Level**: {seniority_level}

### Job Requirements
{jd_summary}

### Focus Areas from Gap Analysis
{focus_areas}

### Interview Sections
{sections_summary}

## Instructions

Create a scoring rubric with:

### Scoring Areas (4-6 areas)

Based on the interview type:

**Technical Interviews:**
- Technical Knowledge (25-35%)
- Problem Solving (20-30%)
- Code Quality/Best Practices (15-20%)
- Communication (10-15%)
- Learning Ability (10-15%)

**Culture Fit Interviews:**
- Values Alignment (25-30%)
- Collaboration (20-25%)
- Communication (20-25%)
- Growth Mindset (15-20%)
- Role Motivation (10-15%)

**System Design Interviews:**
- Architecture Design (30-35%)
- Scalability Thinking (20-25%)
- Trade-off Analysis (15-20%)
- Communication (15-20%)
- Technical Breadth (10-15%)

**Leadership Interviews:**
- People Leadership (25-30%)
- Strategic Thinking (20-25%)
- Execution & Delivery (20-25%)
- Communication (15-20%)
- Cultural Impact (10-15%)

### For Each Scoring Area:
1. **Weight**: Percentage of total score (must sum to 100%)
2. **Criteria**: 3-5 specific things to evaluate
3. **Indicators**: For each criterion, describe what each score level looks like:
   - 1 (Poor): Does not meet expectations
   - 2 (Below Average): Partially meets, significant concerns
   - 3 (Meets): Meets expectations for the level
   - 4 (Above Average): Exceeds expectations
   - 5 (Excellent): Exceptional, significantly exceeds
4. **Pass Threshold**: Minimum score to pass this area (typically 3)

### Calibration Notes

- Adjust expectations based on seniority level
- A "3" for a senior role is higher bar than a "3" for junior
- Consider the specific role requirements
- Flag any areas that are absolute must-pass (veto power)

## Output

Create a comprehensive rubric following the ScoringArea schema list."""
