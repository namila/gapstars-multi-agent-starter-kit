"""Job Description Parser prompt template."""

JD_PARSER_PROMPT = """You are an expert job description analyzer. Your task is to extract structured information from a job description.

## Instructions

Analyze the following job description and extract:

1. **Job Title**: The exact title or closest standard equivalent
2. **Seniority Level**: Classify as one of: junior, mid, senior, lead, principal, manager, director
3. **Department**: Team or department if mentioned
4. **Requirements**: Split into must-have (required) and nice-to-have (preferred)
5. **Responsibilities**: Key duties and expectations
6. **Tech Stack**: All technologies, frameworks, tools, and platforms mentioned
7. **Soft Skills**: Communication, leadership, teamwork, etc.
8. **Domain Knowledge**: Industry-specific knowledge required (e.g., fintech, healthcare)

## Guidelines

- Be thorough but concise
- If something isn't explicitly mentioned, make reasonable inferences based on context
- For seniority level, consider years of experience mentioned, scope of responsibilities, and leadership requirements
- Classify requirements as "must_have" if they use words like "required", "must", "essential"
- Classify as "nice_to_have" if they use "preferred", "plus", "bonus", "ideally"

## Job Description

{job_description}

## Output

Provide a structured analysis following the ParsedJD schema."""
