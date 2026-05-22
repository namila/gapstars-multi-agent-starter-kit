# Interview Structure Generator - Requirements Document

## 1. Project Overview

### 1.1 Purpose
A multi-agent system that generates comprehensive interview structures to assist interviewers in conducting effective, consistent, and fair interviews across different roles and interview types.

### 1.2 Problem Statement
Interviewers often face challenges in:
- Creating consistent interview structures across candidates
- Tailoring questions to specific roles and candidate backgrounds
- Ensuring comprehensive coverage of required skills and competencies
- Maintaining objective evaluation criteria

### 1.3 Solution
An AI-powered multi-agent system that takes job descriptions, candidate resumes, and interview type preferences as input, and generates comprehensive interview packages.

#### Key Outcomes
The system produces the following deliverables:

1. **Interview Structure** - A well-organized interview flow with time allocations and logical progression through assessment areas

2. **Key Focus Areas** - Priority areas to explore based on role requirements and candidate background analysis

3. **Suggested Questions** - Curated questions tailored to the role, level, and interview type

4. **Candidate-Specific Follow-up Questions** - Personalized probing questions derived from the candidate's resume, experience gaps, and career trajectory

5. **Evaluation Criteria** - Clear competency definitions and behavioral indicators for objective assessment

6. **Suggested Scoring Areas** - Weighted scoring dimensions aligned with role priorities and hiring criteria

---

## 2. Target Users

| User Type | Description | Primary Use Case |
|-----------|-------------|------------------|
| Recruiters/HR | Non-technical users conducting initial screens | HR and screening interviews |
| Hiring Managers | Department leads assessing team and culture fit | Behavioral interviews |
| Technical Interviewers | Engineers evaluating technical competencies | Technical interviews |

---

## 3. Functional Requirements

### 3.1 Input Requirements

#### 3.1.1 Job Description (Required)
**Input Format**: Raw text paragraph (copy-pasted or uploaded JD)

**AI-Extracted Information**: The JD Parser Agent will automatically extract:
- **Must-Have Skills** - Critical skills and qualifications required for the role
- **Nice-to-Have Skills** - Preferred but non-essential skills that add value
- **Role Expectations** - Key responsibilities, deliverables, and performance expectations

#### 3.1.2 Candidate Resume (Required)
**Input Format**: PDF file upload

**AI-Extracted Information**: The Resume Parser Agent will automatically extract:
- **Work Experience** - Job history, roles, companies, and tenure
- **Technical Skills & Certifications** - Technologies, tools, and professional certifications
- **Educational Background** - Degrees, institutions, and relevant coursework
- **Projects & Achievements** - Notable accomplishments and project contributions
- **Career Progression** - Growth trajectory and role transitions

#### 3.1.3 Interview Type (Required)
**Input Format**: Single selection from dropdown

**Available Options**:
- **Culture Fit** - Assess alignment with company values, team dynamics, and work style
- **System Design** - Evaluate architectural thinking, scalability considerations, and technical decision-making
- **Leadership** - Assess management capabilities, team building, and strategic thinking
- **Technical** - Evaluate coding skills, problem-solving abilities, and technical knowledge

### 3.2 Output Requirements

#### 3.2.1 Interview Structure
- **Opening Section** (5-10 min)
  - Icebreaker questions
  - Interview agenda overview
  - Candidate comfort establishment

- **Core Assessment Sections** (varies by type)
  - Organized by competency/skill area
  - Time allocation per section
  - Question progression (easy → complex)

- **Candidate Questions Section** (5-10 min)
  - Time for candidate to ask questions
  - Suggested talking points about role/company

- **Closing Section** (5 min)
  - Next steps communication
  - Timeline expectations

#### 3.2.2 Question Bank
For each question:
- Primary question text
- Follow-up/probing questions
- Expected answer guidelines (what good looks like)
- Red flags to watch for
- Skill/competency being assessed
- Difficulty level indicator

#### 3.2.3 Scoring Rubric
- Competency-based scoring matrix
- Rating scale (1-5) with clear descriptors
- Weighted scoring based on role priorities
- Space for interviewer notes
- Overall recommendation framework

#### 3.2.4 Interviewer Guidance
- Tips for conducting this specific interview
- Candidate-specific talking points (from resume)
- Areas requiring deeper exploration
- Potential bias awareness notes
- Legal/compliance reminders

### 3.3 Interview Type Specifications

#### 3.3.1 Technical Interview
- **Coding Assessment**
  - Algorithm and data structure questions
  - Language-specific questions
  - Code review scenarios
  - Debugging exercises

- **Technical Knowledge**
  - Technology stack proficiency
  - Best practices and patterns
  - Tool and framework familiarity

- **Problem-Solving**
  - Analytical thinking evaluation
  - Edge case handling
  - Optimization approaches

#### 3.3.2 Culture Fit Interview
- **Values Alignment**
  - Company values reflection questions
  - Ethical decision-making scenarios
  - Mission and vision alignment

- **Team Dynamics**
  - Collaboration style assessment
  - Conflict resolution approaches
  - Communication preferences

- **Work Style**
  - Remote/hybrid work compatibility
  - Feedback reception and delivery
  - Adaptability to change

#### 3.3.3 System Design Interview
- **Architecture Fundamentals**
  - High-level system design
  - Component breakdown and responsibilities
  - Technology selection rationale

- **Scalability & Performance**
  - Load handling strategies
  - Caching and optimization techniques
  - Database design considerations

- **Trade-off Analysis**
  - Consistency vs availability decisions
  - Build vs buy evaluations
  - Technical debt considerations

#### 3.3.4 Leadership Interview
- **Team Management**
  - Hiring and team building experience
  - Performance management approaches
  - Mentoring and development strategies

- **Strategic Thinking**
  - Vision setting and communication
  - Prioritization and decision-making
  - Cross-functional collaboration

- **Crisis Management**
  - Handling difficult situations
  - Change management experience
  - Stakeholder management

---

## 4. Multi-Agent Architecture

### 4.1 Agent Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR AGENT                          │
│         (Coordinates workflow and manages agent handoffs)        │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        ┌───────────────┐              ┌───────────────┐
        │   JD PARSER   │              │ RESUME PARSER │
        │     AGENT     │              │     AGENT     │
        └───────────────┘              └───────────────┘
                │                               │
                └───────────────┬───────────────┘
                                ▼
                ┌─────────────────────────────────────┐
                │         MATCHING AGENT              │
                │  (Identifies gaps and focus areas)  │
                └─────────────────────────────────────┘
                                │
                                ▼
                ┌─────────────────────────────────────┐
                │       QUESTION GENERATOR AGENT      │
                │  (Generates questions from JD +     │
                │   Resume + Interview Type)          │
                └─────────────────────────────────────┘
                                │
                                ▼
                ┌─────────────────────────────────────┐
                │       STRUCTURE COMPOSER AGENT      │
                │   (Assembles final interview guide) │
                └─────────────────────────────────────┘
                                │
                                ▼
                ┌─────────────────────────────────────┐
                │        RUBRIC GENERATOR AGENT       │
                │  (Creates evaluation criteria)      │
                └─────────────────────────────────────┘
```

### 4.2 Agent Responsibilities

| Agent | Input | Output | Responsibility | Specific Logic |
|-------|-------|--------|----------------|----------------|
| **Orchestrator** | User request | Coordinated workflow | Manages flow, handles errors, ensures quality | Validate inputs before dispatching; retry failed agents up to 3 times; aggregate results from all agents; handle timeout scenarios |
| **JD Parser** | Job description text | Structured JD data | Extract must-have skills, nice-to-have skills, role expectations | Categorize skills by priority; identify seniority level from title/requirements; normalize skill names to standard taxonomy |
| **Resume Parser** | Resume PDF | Structured resume data | Extract experience, skills, education, achievements, career progression | Calculate total years of experience; identify skill proficiency levels; detect career gaps; extract quantifiable achievements |
| **Matching Agent** | Parsed JD + Resume | Gap analysis, focus areas | Identify alignment and areas needing exploration | Compare JD skills vs Resume skills; flag missing must-have skills; identify over-qualification; prioritize focus areas by importance |
| **Question Generator** | Parsed JD + Resume + Interview Type + Matching Agent Output (focus areas, gap analysis) | Question bank | Generate tailored questions based on JD requirements and candidate background | Generate questions for each focus area identified by Matching Agent; include candidate-specific follow-ups based on resume gaps; vary difficulty based on seniority; ensure coverage of all must-have skills. **For Technical/System Design interviews**: If candidate is senior → include architecture/design questions; If role is frontend-heavy → include UI, state management, and performance questions; If candidate has limited experience in a key skill → add deeper probing questions |
| **Structure Composer** | All parsed data + questions | Interview structure | Organize into timed, logical interview flow | Allocate time proportionally to priority areas; place easier questions first; ensure smooth topic transitions; include buffer time for candidate questions |
| **Rubric Generator** | Structure + requirements | Scoring rubric | Create evaluation criteria and scoring guide | Define 1-5 scale descriptors for each competency; weight scoring areas based on JD priorities; include observable behavioral indicators; add red flags and green flags for each area |

### 4.3 Agent Communication Flow

1. User submits JD, Resume, and Interview Type
2. Orchestrator validates inputs and dispatches to JD Parser and Resume Parser (parallel)
3. JD Parser extracts must-have skills, nice-to-have skills, and role expectations
4. Resume Parser extracts experience, skills, education, achievements, and career progression
5. Matching Agent receives parsed JD + Resume, analyzes to identify gaps and focus areas
6. Question Generator receives parsed JD + Resume + Interview Type + Matching Agent output (focus areas, gap analysis) and creates tailored question bank
7. Structure Composer assembles questions into timed, logical interview flow
8. Rubric Generator creates evaluation criteria and scoring guide
9. Orchestrator compiles all outputs and returns final interview package

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Interview structure generation: < 30 seconds
- Support concurrent requests: minimum 10 simultaneous users
- Streaming response for real-time feedback

### 5.2 Scalability
- Stateless agent design for horizontal scaling
- Caching for common job roles and question patterns
- Async processing for heavy operations

### 5.3 Reliability
- Graceful degradation if individual agents fail
- Retry mechanisms for LLM API calls
- Conversation state persistence (existing checkpointer)

### 5.4 Security
- No storage of sensitive candidate PII beyond session
- Input sanitization for all user-provided content
- Rate limiting to prevent abuse

### 5.5 Usability
- Clear progress indicators during generation
- Ability to regenerate specific sections
- Export options (PDF, Markdown, JSON)

---

## 6. Technical Requirements

### 6.1 Backend (Existing Stack)
- **Framework**: FastAPI
- **Agent Framework**: LangGraph
- **LLM Providers**: OpenAI, Mistral (existing support)
- **Database**: PostgreSQL (existing checkpointer)
- **Python**: 3.12 with uv

### 6.2 Frontend (Existing Stack)
- **Framework**: Next.js 15
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Runtime**: Bun

### 6.3 New Components Required
- PDF parsing library for resume upload
- Document export functionality
- Enhanced streaming for multi-agent progress

---

## 7. User Interface Requirements

### 7.1 Input Interface
- **Step 1**: Job Description input (paste or upload)
- **Step 2**: Resume upload (PDF)
- **Step 3**: Interview Type selection (single selection: Technical, Culture Fit, System Design, Leadership)

### 7.2 Output Interface
- Tabbed view for different sections:
  - Overview / Summary
  - Interview Structure (timeline view)
  - Question Bank (filterable, searchable)
  - Scoring Rubric
  - Interviewer Notes
- Real-time generation progress
- Section-by-section streaming

### 7.3 Actions
- Download as PDF
- Export as Markdown
- Copy to clipboard
- Save to history
- Share with team (future)
- Regenerate specific sections

---

## 8. Future Enhancements (Out of Scope for MVP)

- [ ] Integration with ATS systems (Greenhouse, Lever, etc.)
- [ ] Interview scheduling integration
- [ ] Post-interview feedback collection
- [ ] Analytics and interview effectiveness tracking
- [ ] Custom question bank management
- [ ] Team collaboration features
- [ ] Interview recording and transcription analysis
- [ ] Multi-language support

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Generation success rate | > 95% |
| Average generation time | < 30 seconds |
| User satisfaction (post-MVP survey) | > 4.0/5.0 |
| Question relevance score | > 80% rated "relevant" by users |
| Adoption rate among pilot users | > 60% weekly active |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucination in questions | Medium | Validation agent, human review capability |
| Poor resume parsing quality | High | Multiple parsing strategies, manual input fallback |
| Bias in generated questions | High | Bias detection checks, diverse training prompts |
| API rate limits during high usage | Medium | Request queuing, caching, fallback providers |
| Long generation times | Medium | Streaming responses, parallel agent execution |

---

## 11. Glossary

| Term | Definition |
|------|------------|
| JD | Job Description |
| STAR Method | Situation, Task, Action, Result - behavioral interview framework |
| Rubric | Scoring criteria and evaluation framework |
| Red Flag | Warning indicator suggesting potential concerns |
| Competency | Specific skill or ability being assessed |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-22 | Generated | Initial requirements document |
