# Blueprint: Customer Support Ticket Workflow

## Overview
User submits a support ticket → Agent 1 classifies it → Agent 2 generates resolution steps.

---

## Agent Design (2 agents, mandatory for judging)

| Agent | Role | Input | Output |
|---|---|---|---|
| **ClassifierAgent** | Reads ticket, determines category + priority | Raw ticket text | Category, Priority, next_action |
| **ResolutionAgent** | Takes classification, generates resolution | ClassifierAgent output | Steps, escalation flag, ETA |

**Decision logic:** If `priority` is `Critical` or `High` → ResolutionAgent uses escalation path. Otherwise → standard resolution path.

---

## Backend

### 1. Create `apps/api/src/api/agent/workflows/support_ticket.py`

```python
SYSTEM_PROMPT = """
You are a two-agent customer support triage system. Follow this exact two-phase process:

=== PHASE 1: ClassifierAgent ===
Analyze the ticket and output EXACTLY this block:
[AGENT:ClassifierAgent]
Category: <Billing | Technical | Account | General>
Priority: <Low | Medium | High | Critical>
Summary: <one sentence>
Decision: <what ResolutionAgent should do>
[/AGENT]

=== PHASE 2: ResolutionAgent ===
Based on Phase 1 output, generate resolution steps. Output EXACTLY this block:
[AGENT:ResolutionAgent]
Escalate: <Yes | No>
ETA: <e.g. 2–4 hours>
Steps:
1. <step>
2. <step>
3. <step>
[/AGENT]

Always output both phases in sequence. Never skip a phase.
"""
```

### 2. Create `apps/api/src/api/routers/workflow.py`

```python
from __future__ import annotations

import uuid
from typing import AsyncGenerator, Literal, Optional

from fastapi import APIRouter, Request
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
import json

from api.agent.graph import build_graph
from api.config import LLMProvider, settings

router = APIRouter(prefix="/api/workflow", tags=["workflow"])

WorkflowType = Literal["support_ticket", "bug_triage", "marketing"]

def _get_system_prompt(workflow: WorkflowType) -> str:
    if workflow == "support_ticket":
        from api.agent.workflows.support_ticket import SYSTEM_PROMPT
    elif workflow == "bug_triage":
        from api.agent.workflows.bug_triage import SYSTEM_PROMPT
    else:
        from api.agent.workflows.marketing import SYSTEM_PROMPT
    return SYSTEM_PROMPT

class WorkflowRequest(BaseModel):
    workflow: WorkflowType
    message: str
    thread_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider: Optional[LLMProvider] = None

@router.post("/stream")
async def workflow_stream(body: WorkflowRequest, request: Request):
    checkpointer = request.app.state.checkpointer
    provider = body.provider or settings.llm_provider
    graph = build_graph(checkpointer=checkpointer, provider=provider)
    config = {"configurable": {"thread_id": body.thread_id}}
    system_prompt = _get_system_prompt(body.workflow)

    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=body.message),
            ]
            async for event in graph.astream_events(
                {"messages": messages}, config=config, version="v2"
            ):
                kind = event.get("event")
                if kind == "on_chat_model_stream":
                    chunk = event["data"].get("chunk")
                    if chunk and chunk.content:
                        token = chunk.content if isinstance(chunk.content, str) else ""
                        if token:
                            yield {"event": "token", "data": json.dumps({"token": token})}
            yield {"event": "done", "data": json.dumps({"thread_id": body.thread_id, "provider": provider})}
        except Exception as exc:
            yield {"event": "error", "data": json.dumps({"detail": str(exc)})}

    return EventSourceResponse(event_generator())
```

### 3. Mount router in `apps/api/src/api/main.py`

Add after existing router import:
```python
from api.routers.workflow import router as workflow_router
# in create_app():
app.include_router(workflow_router)
```

### 4. Create `apps/api/src/api/agent/workflows/__init__.py`

Empty file.

---

## Frontend

### 1. Add to `apps/web/lib/types.ts`

```ts
export type WorkflowType = "support_ticket" | "bug_triage" | "marketing"

export interface AgentStep {
  agent: string
  status: "waiting" | "running" | "done"
  decision?: string
}

export interface WorkflowStreamChunk extends StreamChunk {
  agent_start?: string   // agent name that just started
  agent_done?: string    // agent name that just finished
  decision?: string
}
```

### 2. Create `apps/web/hooks/use-workflow.ts`

```ts
"use client"

import { useCallback, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { API_URL, type LLMProvider, type AgentStep } from "@/lib/types"

const SUPPORT_TICKET_AGENTS = ["ClassifierAgent", "ResolutionAgent"]

export function useWorkflow() {
  const [output, setOutput] = useState("")
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>(
    SUPPORT_TICKET_AGENTS.map(a => ({ agent: a, status: "waiting" }))
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadIdRef = useRef(uuidv4())

  const run = useCallback(async (message: string, provider?: LLMProvider) => {
    setOutput("")
    setError(null)
    setAgentSteps(SUPPORT_TICKET_AGENTS.map(a => ({ agent: a, status: "waiting" })))
    setIsStreaming(true)

    try {
      const res = await fetch(`${API_URL}/api/workflow/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: "support_ticket",
          message,
          thread_id: threadIdRef.current,
          provider,
        }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.slice(5).trim())
              if (data.token) {
                const token: string = data.token
                setOutput(prev => prev + token)
                // Detect agent markers in streamed text
                if (token.includes("[AGENT:ClassifierAgent]")) {
                  setAgentSteps(prev => prev.map(s =>
                    s.agent === "ClassifierAgent" ? { ...s, status: "running" } : s
                  ))
                }
                if (token.includes("[/AGENT]")) {
                  setAgentSteps(prev => {
                    const running = prev.find(s => s.status === "running")
                    if (!running) return prev
                    const idx = prev.indexOf(running)
                    const next = [...prev]
                    next[idx] = { ...running, status: "done" }
                    if (next[idx + 1]) next[idx + 1] = { ...next[idx + 1], status: "running" }
                    return next
                  })
                }
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsStreaming(false)
      setAgentSteps(prev => prev.map(s => ({ ...s, status: "done" })))
    }
  }, [])

  return { output, agentSteps, isStreaming, error, threadId: threadIdRef.current, run }
}
```

### 3. Create `apps/web/components/workflow/agent-pipeline.tsx`

```tsx
import { Badge } from "@/components/ui/badge"
import { type AgentStep } from "@/lib/types"
import { Loader2, CheckCircle2, Circle, ArrowDown } from "lucide-react"

export function AgentPipeline({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="flex flex-col gap-1 p-4 border rounded-lg bg-muted/30 min-w-[220px]">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Agent Pipeline</p>
      {steps.map((step, i) => (
        <div key={step.agent}>
          <div className="flex items-center gap-2 py-1">
            {step.status === "waiting" && <Circle className="size-4 text-muted-foreground" />}
            {step.status === "running" && <Loader2 className="size-4 text-blue-500 animate-spin" />}
            {step.status === "done" && <CheckCircle2 className="size-4 text-green-500" />}
            <span className={`text-sm font-medium ${step.status === "waiting" ? "text-muted-foreground" : "text-foreground"}`}>
              {step.agent}
            </span>
            <Badge variant={step.status === "done" ? "default" : "secondary"} className="ml-auto text-xs">
              {step.status}
            </Badge>
          </div>
          {step.decision && (
            <p className="text-xs text-muted-foreground ml-6 mb-1">→ {step.decision}</p>
          )}
          {i < steps.length - 1 && <ArrowDown className="size-3 text-muted-foreground ml-1" />}
        </div>
      ))}
    </div>
  )
}
```

### 4. Create `apps/web/components/workflow/support-ticket-form.tsx`

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AgentPipeline } from "./agent-pipeline"
import { useWorkflow } from "@/hooks/use-workflow"
import { Loader2 } from "lucide-react"

export function SupportTicketForm() {
  const [ticket, setTicket] = useState("")
  const [customer, setCustomer] = useState("")
  const { output, agentSteps, isStreaming, error, run } = useWorkflow()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticket.trim()) return
    const message = `Customer: ${customer || "Anonymous"}\n\nTicket:\n${ticket}`
    run(message)
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="font-semibold">Customer Support Ticket</h1>
        <p className="text-xs text-muted-foreground">AI-powered triage and resolution</p>
      </header>

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left: Input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-1/2">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Customer name (optional)"
            value={customer}
            onChange={e => setCustomer(e.target.value)}
          />
          <Textarea
            className="flex-1 resize-none"
            placeholder="Describe the support ticket..."
            value={ticket}
            onChange={e => setTicket(e.target.value)}
            rows={8}
          />
          <Button type="submit" disabled={isStreaming || !ticket.trim()}>
            {isStreaming ? <><Loader2 className="size-4 mr-2 animate-spin" /> Processing...</> : "Analyze Ticket"}
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

### 5. Activate via `apps/web/app/workflow/page.tsx`

```tsx
import { SupportTicketForm } from "@/components/workflow/support-ticket-form"

export default function WorkflowPage() {
  return <SupportTicketForm />
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
1. Ensure `workflow_router` is mounted in `main.py`.
2. Rebuild and restart API with latest backend changes:
  - `docker-compose up -d --build api`
3. Verify backend is healthy:
  - `http://localhost:8000/api/health` should return 200.
4. Set the active page to `SupportTicketForm` in `app/workflow/page.tsx`.
5. Navigate to http://localhost:3000/workflow.
6. In UI, choose the model provider from the selector (OpenAI or Mistral) before running analysis.
