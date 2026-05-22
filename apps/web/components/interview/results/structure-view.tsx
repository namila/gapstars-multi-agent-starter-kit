"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Clock, MessageSquare } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { InterviewSection, Question, InterviewGuidance } from "@/lib/interview-types"
import { cn } from "@/lib/utils"

interface StructureViewProps {
  structure: InterviewSection[]
  questions: Question[]
  guidance: InterviewGuidance
}

export function StructureView({ structure, questions, guidance }: StructureViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))

  // Create a map of question IDs to questions for quick lookup
  const questionMap = new Map(questions.map((q) => [q.id, q]))

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const totalDuration = structure.reduce((sum, s) => sum + s.duration_minutes, 0)

  return (
    <div className="space-y-6">
      {/* Timeline header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Interview Timeline</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4" />
          <span className="text-sm">{totalDuration} minutes total</span>
        </div>
      </div>

      {/* Opening script */}
      {guidance.opening_script && (
        <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <MessageSquare className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-sm text-blue-700 dark:text-blue-300">
                Opening Script
              </h3>
              <p className="mt-1 text-sm text-blue-800/80 dark:text-blue-200/80 whitespace-pre-line">
                {guidance.opening_script}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {structure.map((section, index) => {
          const isExpanded = expandedSections.has(index)
          const sectionQuestions = section.question_ids
            .map((id) => questionMap.get(id))
            .filter(Boolean) as Question[]

          return (
            <div key={index} className="rounded-lg border">
              {/* Section header */}
              <button
                onClick={() => toggleSection(index)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-medium">{section.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {section.duration_minutes} min
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    {sectionQuestions.length} questions
                  </Badge>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-4">
                  {/* Interviewer notes */}
                  {section.interviewer_notes.length > 0 && (
                    <div className="rounded-md bg-muted/50 p-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                        Interviewer Notes
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {section.interviewer_notes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Questions for this section */}
                  {sectionQuestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase">
                        Questions
                      </h4>
                      {sectionQuestions.map((q, i) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 rounded-md border p-3"
                        >
                          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{q.question}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  q.difficulty === "hard"
                                    ? "destructive"
                                    : q.difficulty === "medium"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {q.difficulty}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                ~{q.time_minutes} min
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Closing script */}
      {guidance.closing_script && (
        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/30">
          <div className="flex items-start gap-3">
            <MessageSquare className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-sm text-green-700 dark:text-green-300">
                Closing Script
              </h3>
              <p className="mt-1 text-sm text-green-800/80 dark:text-green-200/80 whitespace-pre-line">
                {guidance.closing_script}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Time management tips */}
      {guidance.time_management_tips.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="font-medium text-sm mb-2">Time Management Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {guidance.time_management_tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
