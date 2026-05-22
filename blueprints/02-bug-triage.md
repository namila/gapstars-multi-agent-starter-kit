# Blueprint: Bug Triage Workflow

## Overview
User submits a bug report → Agent 1 analyzes severity + affected area → Agent 2 generates fix strategy and assigns ownership.

---

## Agent Design (2 agents, mandatory for judging)

| Agent | Role | Input | Output |
|---|---|---|---|
| **AnalyzerAgent** | Reads bug report, determines severity + affected component | Raw bug description | Severity, Component, Reproducibility |
| **TriageAgent** | Takes analysis, recommends fix path and ownership | AnalyzerAgent output | Fix steps, Owner, Escalate flag |

**Decision logic:** If `severity` is `P0` or `P1` → TriageAgent triggers escalation path with immediate owner assignment. `P2/P3` → standard fix suggestion path.

---

## Backend

### 1. Create `apps/api/src/api/agent/workflows/bug_triage.py`

```python
SYSTEM_PROMPT = """
You are a two-agent software bug triage system. Follow this exact two-phase process:

=== PHASE 1: AnalyzerAgent ===
Analyze the bug report and output EXACTLY this block:
[AGENT:AnalyzerAgent]
Severity: <P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)>
Component: <affected area, e.g. Auth, Payments, UI, API, Database>
Reproducible: <Always | Sometimes | Rarely | Unknown>
Root Cause Hypothesis: <brief hypothesis>
Decision: <escalate immediately | standard triage | needs more info>
[/AGENT]

=== PHASE 2: TriageAgent ===
Based on Phase 1, generate the triage plan. Output EXACTLY this block:
[AGENT:TriageAgent]
Escalate: <Yes | No>
Suggested Owner: <Frontend | Backend | DevOps | QA | Unknown>
Fix Strategy:
1. <step>
2. <step>
3. <step>
Workaround: <any temporary workaround or "None">
[/AGENT]

Always output both phases in sequence. Never skip a phase.
"""
```

### 2. Router (`workflow.py`) — same shared router as support ticket

Workflow type `"bug_triage"` is already handled by the shared `workflow.py` router from blueprint 01. No new router needed.

### 3. Mount router in `main.py` — same as blueprint 01 (already done if support ticket was implemented)

---

## Frontend

### 1. Add to `apps/web/lib/types.ts` — same additions as blueprint 01 (already done)

### 2. Create `apps/web/hooks/use-bug-triage.ts`

Copy `use-workflow.ts` from blueprint 01, change these values:

```ts
// Change workflow type
workflow: "bug_triage",

// Change agent list
const BUG_TRIAGE_AGENTS = ["AnalyzerAgent", "TriageAgent"]

// Change setAgentSteps initial value
setAgentSteps(BUG_TRIAGE_AGENTS.map(a => ({ agent: a, status: "waiting" })))

// Change agent marker detection
if (token.includes("[AGENT:AnalyzerAgent]")) { ... activate AnalyzerAgent ... }
```

Or make `useWorkflow` accept `workflowType` and `agentNames` as parameters to avoid duplication.

### 3. `agent-pipeline.tsx` — same component, no changes needed

Already built in blueprint 01. Works for any list of `AgentStep[]`.

### 4. Create `apps/web/components/workflow/bug-triage-form.tsx`

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AgentPipeline } from "./agent-pipeline"
import { useWorkflow } from "@/hooks/use-workflow"
import { Loader2 } from "lucide-react"

const ENVIRONMENTS = ["Browser", "Mobile", "Server", "Desktop", "Unknown"]

export function BugTriageForm() {
  const [description, setDescription] = useState("")
  const [environment, setEnvironment] = useState("Browser")
  const [version, setVersion] = useState("")
  const { output, agentSteps, isStreaming, error, run } = useWorkflow()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    const message = `Bug Report\nEnvironment: ${environment}\nVersion: ${version || "Unknown"}\n\nDescription:\n${description}`
    run(message)
  }

  // Parse severity from output for color coding
  const severity = output.match(/Severity:\s*(P\d[^<\n]*)/)?.[1]?.trim()
  const severityColor = {
    "P0": "text-red-600 font-bold",
    "P1": "text-orange-500 font-bold",
    "P2": "text-yellow-500",
    "P3": "text-green-600",
  }[severity?.split(" ")[0] ?? ""] ?? ""

  return (
    <div className="flex h-svh flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="font-semibold">Bug Triage</h1>
        <p className="text-xs text-muted-foreground">AI-powered severity analysis and fix strategy</p>
      </header>

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left: Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-1/2">
          <div className="flex gap-2">
            <select
              className="border rounded px-3 py-2 text-sm flex-1"
              value={environment}
              onChange={e => setEnvironment(e.target.value)}
            >
              {ENVIRONMENTS.map(env => <option key={env}>{env}</option>)}
            </select>
            <input
              className="border rounded px-3 py-2 text-sm w-28"
              placeholder="Version"
              value={version}
              onChange={e => setVersion(e.target.value)}
            />
          </div>
          <Textarea
            className="flex-1 resize-none"
            placeholder="Describe the bug, steps to reproduce, expected vs actual behavior..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={8}
          />
          <Button type="submit" disabled={isStreaming || !description.trim()}>
            {isStreaming ? <><Loader2 className="size-4 mr-2 animate-spin" />Triaging...</> : "Triage Bug"}
          </Button>
        </form>

        {/* Right: Pipeline + Output */}
        <div className="flex flex-col gap-4 w-1/2 overflow-auto">
          <AgentPipeline steps={agentSteps} />
          {severity && (
            <div className={`text-sm px-3 py-2 border rounded bg-muted/30 ${severityColor}`}>
              Detected severity: {severity}
            </div>
          )}
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

### 5. Activate via `apps/web/app/workflow/page.tsx`

```tsx
import { BugTriageForm } from "@/components/workflow/bug-triage-form"

export default function WorkflowPage() {
  return <BugTriageForm />
}
```

### 6. Provider selection in UI (OpenAI / Mistral)

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
1. Ensure `workflows/bug_triage.py` exists with SYSTEM_PROMPT.
2. Ensure `workflow_router` is mounted in `main.py`.
3. Rebuild and restart API with latest backend changes:
  - `docker-compose up -d --build api`
4. Verify backend is healthy:
  - `http://localhost:8000/api/health` should return 200.
5. Set active page to `BugTriageForm` in `app/workflow/page.tsx`.
6. Navigate to http://localhost:3000/workflow.
7. In UI, choose the model provider from the selector (OpenAI or Mistral) before triaging.
