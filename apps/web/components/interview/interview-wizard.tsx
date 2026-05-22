"use client"

import { ArrowLeft, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProviderSelector } from "@/components/chat/provider-selector"
import { JDInput } from "@/components/interview/jd-input"
import { ResumeUpload } from "@/components/interview/resume-upload"
import { InterviewTypeSelector } from "@/components/interview/interview-type-selector"
import { GenerationProgress } from "@/components/interview/generation-progress"
import { ResultsContainer } from "@/components/interview/results/results-container"
import { useInterviewGenerator } from "@/hooks/use-interview-generator"
import type { LLMProvider } from "@/lib/types"

export function InterviewWizard() {
  const {
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
    generate,
    reset,
    canGenerate,
  } = useInterviewGenerator()

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          {step !== "input" && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => (step === "results" ? reset() : setStep("input"))}
              disabled={isGenerating}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <span className="font-semibold">Interview Generator</span>
        </div>

        <div className="flex items-center gap-2">
          {step === "input" && (
            <ProviderSelector
              value={provider}
              onChange={(p) => setProvider(p as LLMProvider)}
              disabled={isGenerating}
            />
          )}
          {step === "results" && (
            <Button variant="outline" onClick={reset}>
              New Interview
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {step === "input" && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Generate Interview Package</h1>
                <p className="text-muted-foreground">
                  Upload a job description and resume to generate a comprehensive
                  interview guide with questions, structure, and scoring rubric.
                </p>
              </div>

              <div className="space-y-6">
                <JDInput
                  value={jobDescription}
                  onChange={setJobDescription}
                  disabled={isGenerating}
                />

                <ResumeUpload
                  file={resumeFile}
                  onFileChange={setResumeFile}
                  disabled={isGenerating}
                />

                <InterviewTypeSelector
                  value={interviewType}
                  onChange={setInterviewType}
                  disabled={isGenerating}
                />
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={generate}
                  disabled={!canGenerate}
                  className="gap-2"
                >
                  <Sparkles className="size-4" />
                  Generate Interview Package
                </Button>
              </div>

              {!canGenerate && (
                <p className="text-center text-sm text-muted-foreground">
                  {!jobDescription.trim()
                    ? "Please enter a job description"
                    : jobDescription.length < 50
                      ? "Job description must be at least 50 characters"
                      : !resumeFile
                        ? "Please upload a resume PDF"
                        : ""}
                </p>
              )}
            </div>
          )}

          {step === "generating" && (
            <GenerationProgress
              agentStatus={agentStatus}
              currentAgent={currentAgent}
              error={error}
            />
          )}

          {step === "results" && result && (
            <ResultsContainer package={result} />
          )}
        </div>
      </main>
    </div>
  )
}
