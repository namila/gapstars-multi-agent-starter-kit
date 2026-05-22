"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ScoringArea } from "@/lib/interview-types"
import { cn } from "@/lib/utils"

interface RubricViewProps {
  rubric: ScoringArea[]
}

export function RubricView({ rubric }: RubricViewProps) {
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set([0]))

  const toggleArea = (index: number) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const totalWeight = rubric.reduce((sum, a) => sum + a.weight, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scoring Rubric</h2>
        <span className="text-sm text-muted-foreground">
          {rubric.length} scoring areas ({totalWeight}% total weight)
        </span>
      </div>

      {/* Scoring scale legend */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="font-medium text-sm mb-3">Scoring Scale</h3>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="space-y-1">
            <div className="h-2 rounded bg-red-500" />
            <p className="font-medium">1</p>
            <p className="text-muted-foreground">Poor</p>
          </div>
          <div className="space-y-1">
            <div className="h-2 rounded bg-orange-500" />
            <p className="font-medium">2</p>
            <p className="text-muted-foreground">Below Avg</p>
          </div>
          <div className="space-y-1">
            <div className="h-2 rounded bg-yellow-500" />
            <p className="font-medium">3</p>
            <p className="text-muted-foreground">Meets</p>
          </div>
          <div className="space-y-1">
            <div className="h-2 rounded bg-lime-500" />
            <p className="font-medium">4</p>
            <p className="text-muted-foreground">Above Avg</p>
          </div>
          <div className="space-y-1">
            <div className="h-2 rounded bg-green-500" />
            <p className="font-medium">5</p>
            <p className="text-muted-foreground">Excellent</p>
          </div>
        </div>
      </div>

      {/* Scoring areas */}
      <div className="space-y-3">
        {rubric.map((area, index) => {
          const isExpanded = expandedAreas.has(index)

          return (
            <div key={index} className="rounded-lg border">
              {/* Area header */}
              <button
                onClick={() => toggleArea(index)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-medium">{area.area}</h3>
                    <p className="text-sm text-muted-foreground">
                      {area.criteria.length} criteria
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">{area.weight}%</p>
                    <p className="text-xs text-muted-foreground">weight</p>
                  </div>
                  <Badge variant="outline" className="font-normal">
                    Pass: {area.pass_threshold}+
                  </Badge>
                </div>
              </button>

              {/* Expanded criteria */}
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-4">
                  {area.criteria.map((criterion, cIndex) => (
                    <div key={cIndex} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{criterion.criterion}</h4>
                        <Badge variant="secondary" className="text-xs">
                          Weight: {criterion.weight}
                        </Badge>
                      </div>

                      {/* Indicators */}
                      {Object.keys(criterion.indicators).length > 0 && (
                        <div className="rounded-md bg-muted/50 p-3 space-y-2">
                          {Object.entries(criterion.indicators).map(([score, desc]) => (
                            <div
                              key={score}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 w-8 justify-center",
                                  score === "1" && "border-red-500 text-red-500",
                                  score === "2" && "border-orange-500 text-orange-500",
                                  score === "3" && "border-yellow-600 text-yellow-600",
                                  score === "4" && "border-lime-600 text-lime-600",
                                  score === "5" && "border-green-600 text-green-600"
                                )}
                              >
                                {score}
                              </Badge>
                              <span className="text-muted-foreground">{desc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-medium text-sm mb-3">Overall Scoring Summary</h3>
        <div className="space-y-2">
          {rubric.map((area, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{area.area}</p>
              </div>
              <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${area.weight}%` }}
                />
              </div>
              <span className="text-sm font-medium w-12 text-right">{area.weight}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
