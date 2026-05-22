"use client"

import { useState } from "react"
import { Clock, FileText, ListChecks, Target, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { StructureView } from "@/components/interview/results/structure-view"
import { QuestionsView } from "@/components/interview/results/questions-view"
import { RubricView } from "@/components/interview/results/rubric-view"
import { ExportActions } from "@/components/interview/results/export-actions"
import type { InterviewPackage } from "@/lib/interview-types"
import { INTERVIEW_TYPE_LABELS } from "@/lib/interview-types"
import { cn } from "@/lib/utils"

interface ResultsContainerProps {
  package: InterviewPackage
}

type Tab = "overview" | "structure" | "questions" | "rubric"

export function ResultsContainer({ package: pkg }: ResultsContainerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <FileText className="size-4" /> },
    { id: "structure", label: "Structure", icon: <Clock className="size-4" /> },
    { id: "questions", label: "Questions", icon: <ListChecks className="size-4" /> },
    { id: "rubric", label: "Rubric", icon: <Target className="size-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{pkg.parsed_jd.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{INTERVIEW_TYPE_LABELS[pkg.interview_type]}</Badge>
              <Badge variant="outline">{pkg.parsed_jd.level} level</Badge>
              <Badge variant="outline">{pkg.total_duration_minutes} minutes</Badge>
            </div>
          </div>
          <ExportActions package={pkg} />
        </div>

        {/* Quick stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="size-4" />
              <span className="text-sm">Match Score</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {pkg.gap_analysis.overall_match_score}%
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ListChecks className="size-4" />
              <span className="text-sm">Questions</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{pkg.questions.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4" />
              <span className="text-sm">Sections</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{pkg.structure.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="size-4" />
              <span className="text-sm">Candidate</span>
            </div>
            <p className="mt-1 text-lg font-semibold truncate">
              {pkg.parsed_resume.name || "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && <OverviewTab package={pkg} />}
        {activeTab === "structure" && <StructureView structure={pkg.structure} questions={pkg.questions} guidance={pkg.guidance} />}
        {activeTab === "questions" && <QuestionsView questions={pkg.questions} />}
        {activeTab === "rubric" && <RubricView rubric={pkg.rubric} />}
      </div>
    </div>
  )
}

function OverviewTab({ package: pkg }: ResultsContainerProps) {
  return (
    <div className="space-y-6">
      {/* Gap Analysis */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Gap Analysis</h2>

        {/* Strengths */}
        {pkg.gap_analysis.strengths.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-green-600 dark:text-green-400">
              Strengths
            </h3>
            <div className="space-y-2">
              {pkg.gap_analysis.strengths.map((strength, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30"
                >
                  <p className="font-medium text-sm">{strength.area}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {strength.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Gaps */}
        {pkg.gap_analysis.skill_gaps.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Areas to Probe
            </h3>
            <div className="space-y-2">
              {pkg.gap_analysis.skill_gaps.map((gap, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{gap.skill}</p>
                    <Badge
                      variant={
                        gap.gap_severity === "significant"
                          ? "destructive"
                          : gap.gap_severity === "moderate"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {gap.gap_severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {gap.interview_focus}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Focus Areas */}
        {pkg.gap_analysis.focus_areas.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Interview Focus Areas</h3>
            <div className="flex flex-wrap gap-2">
              {pkg.gap_analysis.focus_areas.map((area, i) => (
                <Badge key={i} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {pkg.gap_analysis.recommendations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recommendations</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {pkg.gap_analysis.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Candidate Summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Candidate Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Background</h3>
            <p className="text-sm">
              <strong>Current Role:</strong>{" "}
              {pkg.parsed_resume.current_title || "Not specified"}
            </p>
            <p className="text-sm">
              <strong>Experience:</strong>{" "}
              {pkg.parsed_resume.years_experience
                ? `${pkg.parsed_resume.years_experience} years`
                : "Not specified"}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Top Skills</h3>
            <div className="flex flex-wrap gap-1">
              {pkg.parsed_resume.skills.slice(0, 8).map((skill, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interviewer Guidance */}
      {pkg.guidance.candidate_specific_notes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Interviewer Notes</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {pkg.guidance.candidate_specific_notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
