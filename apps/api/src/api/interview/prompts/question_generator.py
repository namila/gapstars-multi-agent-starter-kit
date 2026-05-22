"""Question Generator prompt template."""

QUESTION_GENERATOR_PROMPT = """You are an expert interview question designer. Create a comprehensive set of interview questions tailored to this specific candidate and role.

## Context

**Interview Type**: {interview_type}
**Job Title**: {job_title}
**Seniority Level**: {seniority_level}

### Job Requirements Summary
{jd_summary}

### Candidate Profile Summary
{resume_summary}

### Gap Analysis
{gap_analysis}

## Instructions

Generate 12-18 questions covering:

### For Technical Interviews:
1. **Core Technical Skills** (4-6 questions): Test fundamental knowledge in required technologies
2. **Problem Solving** (2-3 questions): Algorithm/coding challenges appropriate to level
3. **System Knowledge** (2-3 questions): Architecture, design patterns, best practices
4. **Experience Validation** (2-3 questions): Verify claims from resume
5. **Gap Probing** (2-3 questions): Specifically address identified skill gaps

### For Culture Fit Interviews:
1. **Values Alignment** (3-4 questions): Company culture fit
2. **Collaboration** (3-4 questions): Team dynamics, conflict resolution
3. **Communication** (2-3 questions): How they explain, listen, give feedback
4. **Growth Mindset** (2-3 questions): Learning, handling failure, improvement
5. **Motivation** (2-3 questions): Why this role, career goals

### For System Design Interviews:
1. **Architecture Design** (3-4 questions): Design systems at appropriate scale
2. **Trade-off Analysis** (2-3 questions): Decision-making, pros/cons
3. **Scalability** (2-3 questions): Growth handling, bottleneck identification
4. **Real-world Experience** (2-3 questions): Past system design decisions
5. **Technology Choices** (2-3 questions): Framework/tool selection reasoning

### For Leadership Interviews:
1. **People Management** (3-4 questions): Hiring, feedback, development
2. **Decision Making** (2-3 questions): Strategic choices, prioritization
3. **Conflict Resolution** (2-3 questions): Team issues, stakeholder management
4. **Vision & Strategy** (2-3 questions): Direction setting, alignment
5. **Execution** (2-3 questions): Delivery, accountability, process

## Question Guidelines

For each question:
- Make it specific to this candidate's background when possible
- Include difficulty rating (easy/medium/hard)
- Estimate time to answer (1-60 minutes)
- Provide 2-3 follow-up questions
- List what to look for in a good answer
- List red flags indicating a poor answer
- Link to relevant gaps from the analysis when applicable

## Seniority Adjustments

- **Junior**: Focus on fundamentals, learning ability, potential
- **Mid**: Balance of fundamentals and applied experience
- **Senior**: Deep expertise, mentoring others, architectural thinking
- **Lead/Principal**: Technical leadership, influence, system-wide impact
- **Manager/Director**: Team building, strategy, organizational impact

## Output

Generate a comprehensive list of questions following the Question schema."""
