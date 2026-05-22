"use client"

import { Check, Loader2, Circle, AlertCircle } from "lucide-react"

import type { AgentStatusMap, AgentName } from "@/lib/interview-types"
import { AGENT_ORDER, AGENT_DISPLAY_NAMES } from "@/lib/interview-types"
import { cn } from "@/lib/utils"

interface GenerationProgressProps {
  agentStatus: AgentStatusMap
  currentAgent: string | null
  error: string | null
}

export function GenerationProgress({
  agentStatus,
  currentAgent,
  error,
}: GenerationProgressProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Generating Interview Package</h2>
        <p className="text-muted-foreground">
          Our AI agents are analyzing the job description and resume to create a
          comprehensive interview guide.
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-3">
        {AGENT_ORDER.map((agent, index) => {
          const status = agentStatus[agent]?.status || "pending"
          const message = agentStatus[agent]?.message
          const isActive = agent === currentAgent

          return (
            <div key={agent} className="flex items-start gap-3">
              {/* Status icon */}
              <div className="mt-0.5">
                {status === "completed" ? (
                  <div className="flex size-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Check className="size-4 text-green-600 dark:text-green-400" />
                  </div>
                ) : status === "running" || isActive ? (
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="size-4 animate-spin text-primary" />
                  </div>
                ) : status === "error" ? (
                  <div className="flex size-6 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="size-4 text-destructive" />
                  </div>
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-full border-2 border-muted">
                    <Circle className="size-2 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-sm",
                    status === "completed" && "text-green-600 dark:text-green-400",
                    status === "running" && "text-primary",
                    status === "error" && "text-destructive",
                    status === "pending" && "text-muted-foreground"
                  )}
                >
                  {AGENT_DISPLAY_NAMES[agent as AgentName]}
                </p>
                {message && (
                  <p className="text-xs text-muted-foreground truncate">{message}</p>
                )}
              </div>

              {/* Connector line */}
              {index < AGENT_ORDER.length - 1 && (
                <div className="absolute left-3 top-8 h-8 w-px bg-border" />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-destructive">
                Generation failed
              </p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
