"""Resume Parser prompt template."""

RESUME_PARSER_PROMPT = """You are an expert resume analyzer. Your task is to extract structured information from a candidate's resume.

## Instructions

Analyze the following resume text and extract:

1. **Name**: Candidate's full name
2. **Current Title**: Most recent job title
3. **Years of Experience**: Total professional experience (estimate if not explicit)
4. **Skills**: Technical skills with proficiency levels when determinable:
   - beginner: Mentioned or used once
   - intermediate: Used in multiple projects
   - advanced: Deep expertise demonstrated
   - expert: Teaching/leading others, creating frameworks
5. **Work Experience**: For each position:
   - Company name
   - Job title
   - Duration
   - Key achievements and highlights
   - Technologies used
6. **Education**: Degrees, institutions, fields of study
7. **Certifications**: Professional certifications
8. **Projects**: Notable projects mentioned
9. **Summary**: Professional summary or objective

## Guidelines

- Extract actual information, don't invent details
- For years of experience, count from the earliest professional role
- Infer skill levels from how skills are described (e.g., "expert in Python" vs "familiar with Python")
- Focus on achievements with measurable impact when available
- Include all technical skills mentioned, even briefly

## Resume Text

{resume_text}

## Output

Provide a structured analysis following the ParsedResume schema."""
