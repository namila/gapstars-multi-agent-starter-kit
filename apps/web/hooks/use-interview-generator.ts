"use client"

import { useCallback, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import { streamInterviewGeneration } from "@/lib/interview-api"
import type {
  AgentStatusMap,
  InterviewPackage,
  InterviewType,
  AgentProgressEvent,
} from "@/lib/interview-types"
import { AGENT_ORDER } from "@/lib/interview-types"
import type { LLMProvider } from "@/lib/types"

export type GenerationStep = "input" | "generating" | "results"

export interface UseInterviewGeneratorReturn {
  // Current step
  step: GenerationStep
  setStep: (step: GenerationStep) => void

  // Input state
  jobDescription: string
  setJobDescription: (jd: string) => void
  resumeFile: File | null
  setResumeFile: (file: File | null) => void
  interviewType: InterviewType
  setInterviewType: (type: InterviewType) => void
  provider: LLMProvider
  setProvider: (provider: LLMProvider) => void

  // Generation state
  isGenerating: boolean
  agentStatus: AgentStatusMap
  currentAgent: string | null
  error: string | null

  // Results
  result: InterviewPackage | null
  threadId: string

  // Actions
  generate: () => Promise<void>
  reset: () => void
  canGenerate: boolean
}

export function useInterviewGenerator(): UseInterviewGeneratorReturn {
  // Step management
  const [step, setStep] = useState<GenerationStep>("input")

  // Input state
  const [jobDescription, setJobDescription] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [interviewType, setInterviewType] = useState<InterviewType>("technical")
  const [provider, setProvider] = useState<LLMProvider>("mistral")

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [agentStatus, setAgentStatus] = useState<AgentStatusMap>({})
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Results
  const [result, setResult] = useState<InterviewPackage | null>(null)
  const threadIdRef = useRef<string>(uuidv4())

  // Validation
  const canGenerate =
    jobDescription.trim().length >= 50 && resumeFile !== null && !isGenerating

  // Initialize agent status
  const initializeAgentStatus = useCallback(() => {
    const status: AgentStatusMap = {}
    for (const agent of AGENT_ORDER) {
      status[agent] = { status: "pending" }
    }
    return status
  }, [])

  // Generate interview
  const generate = useCallback(async () => {
    if (!canGenerate || !resumeFile) return

    setIsGenerating(true)
    setError(null)
    setResult(null)
    setAgentStatus(initializeAgentStatus())
    setCurrentAgent(null)
    setStep("generating")

    // Generate new thread ID for this generation
    threadIdRef.current = uuidv4()

    try {
      for await (const chunk of streamInterviewGeneration({
        jobDescription,
        resumeFile,
        interviewType,
        provider,
        threadId: threadIdRef.current,
      })) {
        switch (chunk.type) {
          case "progress": {
            const progress = chunk.data as AgentProgressEvent
            setCurrentAgent(progress.agent)
            setAgentStatus((prev) => ({
              ...prev,
              [progress.agent]: {
                status: progress.status,
                message: progress.message,
              },
            }))

            if (progress.status === "error" && progress.message) {
              setError(progress.message)
            }
            break
          }

          case "result": {
            setResult(chunk.data.package)
            setStep("results")
            break
          }

          case "error": {
            setError(chunk.data.detail)
            break
          }

          case "done": {
            // Generation complete
            break
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsGenerating(false)
      setCurrentAgent(null)
    }
  }, [
    canGenerate,
    resumeFile,
    jobDescription,
    interviewType,
    provider,
    initializeAgentStatus,
  ])

  // Reset everything
  const reset = useCallback(() => {
    setStep("input")
    setJobDescription("")
    setResumeFile(null)
    setInterviewType("technical")
    setIsGenerating(false)
    setAgentStatus({})
    setCurrentAgent(null)
    setError(null)
    setResult(null)
    threadIdRef.current = uuidv4()
  }, [])

  return {
    step,
    setStep,
    jobDescription,
    setJobDescription,
    resumeFile,
    setResumeFile,
    interviewType,
    setInterviewType,
    provider,
    setProvider,
    isGenerating,
    agentStatus,
    currentAgent,
    error,
    result,
    threadId: threadIdRef.current,
    generate,
    reset,
    canGenerate,
  }
}
