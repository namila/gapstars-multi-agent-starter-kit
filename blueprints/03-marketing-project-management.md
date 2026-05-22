# Blueprint: Marketing Project Management Assistant

## Overview
User inputs a campaign brief → Agent 1 breaks it into phases and tasks → Agent 2 assigns timelines, owners, and priorities.

---

## Agent Design (2 agents, mandatory for judging)

| Agent | Role | Input | Output |
|---|---|---|---|
| **PlannerAgent** | Reads brief, defines campaign phases and raw task list | Campaign brief + deadline | Phases, Tasks, Dependencies |
| **SchedulerAgent** | Takes task list, assigns timeline, owners, and priorities | PlannerAgent output | Scheduled tasks with dates, owners, priority |

**Decision logic:** If deadline is less than 2 weeks → SchedulerAgent compresses timeline and parallelizes tasks. If more than 2 weeks → standard sequential scheduling with buffer time.

---

## Backend

### 1. Create `apps/api/src/api/agent/workflows/marketing.py`

```python
SYSTEM_PROMPT = """
You are a two-agent marketing project management assistant. Follow this exact two-phase process:

=== PHASE 1: PlannerAgent ===
Analyze the campaign brief and break it down. Output EXACTLY this block:
[AGENT:PlannerAgent]
Campaign Name: <name>
Goal: <primary goal>
Phases:
  - Phase 1: <name>
  - Phase 2: <name>
  - Phase 3: <name>
Tasks:
  - <task 1>
  - <task 2>
  - <task 3>
  - <task 4>
  - <task 5>
Decision: <tight timeline — compress | normal timeline — standard scheduling>
[/AGENT]

=== PHASE 2: SchedulerAgent ===
Take the task list from Phase 1 and assign timelines and owners. Output EXACTLY this block:
[AGENT:SchedulerAgent]
Timeline Mode: <Compressed | Standard>
Scheduled Tasks:
  1. <task> | Owner: <Designer|Copywriter|Dev|Manager> | Week: <1–N> | Priority: <High|Medium|Low>
  2. <task> | Owner: <...> | Week: <1–N> | Priority: <...>
  3. <task> | Owner: <...> | Week: <1–N> | Priority: <...>
  4. <task> | Owner: <...> | Week: <1–N> | Priority: <...>
  5. <task> | Owner: <...> | Week: <1–N> | Priority: <...>
Key Milestones:
  - Week N: <milestone>
[/AGENT]

Always output both phases in sequence. Never skip a phase.
"""
```

### 2. Router — same shared `workflow.py` from blueprint 01. No changes needed.

### 3. `main.py` mount — same as blueprint 01.

---

## Frontend

### 1. `types.ts` additions — same as blueprint 01 (already done)

### 2. `agent-pipeline.tsx` — same component, no changes needed

### 3. Create `apps/web/components/workflow/marketing-form.tsx`

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AgentPipeline } from "./agent-pipeline"
import { useWorkflow } from "@/hooks/use-workflow"
import { Loader2 } from "lucide-react"

export function MarketingForm() {
  const [brief, setBrief] = useState("")
  const [deadline, setDeadline] = useState("")
  const [teamSize, setTeamSize] = useState("3")
  const { output, agentSteps, isStreaming, error, run } = useWorkflow()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brief.trim()) return
    const message = `Campaign Brief:\n${brief}\n\nDeadline: ${deadline || "Not specified"}\nTeam Size: ${teamSize}`
    run(message)
  }

  // Parse scheduled tasks from output for structured display
  const scheduledSection = output.match(/Scheduled Tasks:([\s\S]*?)(?:Key Milestones:|$)/)?.[1] ?? ""
  const milestonesSection = output.match(/Key Milestones:([\s\S]*?)(?:\[\/AGENT\]|$)/)?.[1] ?? ""

  return (
    <div className="flex h-svh flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="font-semibold">Marketing Project Management</h1>
        <p className="text-xs text-muted-foreground">AI-powered campaign planning and scheduling</p>
      </header>

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left: Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-1/2">
          <div className="flex gap-2">
            <input
              type="date"
              className="border rounded px-3 py-2 text-sm flex-1"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2 text-sm w-28"
              placeholder="Team size"
              type="number"
              min={1}
              value={teamSize}
              onChange={e => setTeamSize(e.target.value)}
            />
          </div>
          <Textarea
            className="flex-1 resize-none"
            placeholder="Describe your campaign: goals, target audience, channels, budget, key messages..."
            value={brief}
            onChange={e => setBrief(e.target.value)}
            rows={8}
          />
          <Button type="submit" disabled={isStreaming || !brief.trim()}>
            {isStreaming ? <><Loader2 className="size-4 mr-2 animate-spin" />Planning...</> : "Generate Plan"}
          </Button>
        </form>

        {/* Right: Pipeline + Output */}
        <div className="flex flex-col gap-4 w-1/2 overflow-auto">
          <AgentPipeline steps={agentSteps} />
          {error && (
            <div className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {output && (
            <div className="rounded border bg-background p-4 text-sm whitespace-pre-wrap font-mono flex-1 overflow-auto">
              {output}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 4. Activate via `apps/web/app/workflow/page.tsx`

```tsx
import { MarketingForm } from "@/components/workflow/marketing-form"

export default function WorkflowPage() {
  return <MarketingForm />
}
```

### 5. Provider selection in UI (OpenAI / Mistral)

Add provider selection to the header using the existing selector from `apps/web/components/chat/provider-selector.tsx`.

```tsx
import { ProviderSelector } from "@/components/chat/provider-selector"
import { type LLMProvider } from "@/lib/types"

const [provider, setProvider] = useState<LLMProvider>("openai")

<ProviderSelector value={provider} onChange={setProvider} disabled={isStreaming} />

run(message, provider)
```

---

## On the day
1. Ensure `workflows/marketing.py` exists with SYSTEM_PROMPT.
2. Ensure `workflow_router` is mounted in `main.py`.
3. Rebuild and restart API with latest backend changes:
  - `docker-compose up -d --build api`
4. Verify backend is healthy:
  - `http://localhost:8000/api/health` should return 200.
5. Set active page to `MarketingForm` in `app/workflow/page.tsx`.
6. Navigate to http://localhost:3000/workflow.
7. In UI, choose the model provider from the selector (OpenAI or Mistral) before generating the plan.
