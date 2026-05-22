"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Search, Filter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Question } from "@/lib/interview-types"
import { cn } from "@/lib/utils"

interface QuestionsViewProps {
  questions: Question[]
}

export function QuestionsView({ questions }: QuestionsViewProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(questions.map((q) => q.category)))

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (searchQuery && !q.question.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter && q.category !== categoryFilter) {
      return false
    }
    if (difficultyFilter && q.difficulty !== difficultyFilter) {
      return false
    }
    return true
  })

  // Group by category
  const groupedQuestions = filteredQuestions.reduce(
    (acc, q) => {
      if (!acc[q.category]) {
        acc[q.category] = []
      }
      acc[q.category].push(q)
      return acc
    },
    {} as Record<string, Question[]>
  )

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Question Bank</h2>
        <span className="text-sm text-muted-foreground">
          {filteredQuestions.length} of {questions.length} questions
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter || ""}
          onChange={(e) => setCategoryFilter(e.target.value || null)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Difficulty filter */}
        <select
          value={difficultyFilter || ""}
          onChange={(e) => setDifficultyFilter(e.target.value || null)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Questions grouped by category */}
      <div className="space-y-6">
        {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-medium text-muted-foreground uppercase text-xs tracking-wider">
              {category} ({categoryQuestions.length})
            </h3>

            <div className="space-y-2">
              {categoryQuestions.map((q) => {
                const isExpanded = expandedQuestions.has(q.id)

                return (
                  <div key={q.id} className="rounded-lg border">
                    {/* Question header */}
                    <button
                      onClick={() => toggleQuestion(q.id)}
                      className="flex w-full items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
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
                          {q.related_gap && (
                            <Badge variant="outline" className="text-xs">
                              Probes: {q.related_gap}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t px-4 py-3 space-y-4">
                        {/* Follow-ups */}
                        {q.follow_ups.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                              Follow-up Questions
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {q.follow_ups.map((fu, i) => (
                                <li key={i}>{fu}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* What to look for */}
                        {q.what_to_look_for.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-green-600 dark:text-green-400 uppercase mb-2">
                              What to Look For
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-green-700 dark:text-green-300">
                              {q.what_to_look_for.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Red flags */}
                        {q.red_flags.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase mb-2">
                              Red Flags
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                              {q.red_flags.map((flag, i) => (
                                <li key={i}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No questions match your filters.
          </div>
        )}
      </div>
    </div>
  )
}
