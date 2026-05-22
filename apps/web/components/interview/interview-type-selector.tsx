"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InterviewType } from "@/lib/interview-types"
import { INTERVIEW_TYPE_LABELS, INTERVIEW_TYPE_DESCRIPTIONS } from "@/lib/interview-types"

interface InterviewTypeSelectorProps {
  value: InterviewType
  onChange: (value: InterviewType) => void
  disabled?: boolean
}

const INTERVIEW_TYPES: InterviewType[] = [
  "technical",
  "culture_fit",
  "system_design",
  "leadership",
]

export function InterviewTypeSelector({
  value,
  onChange,
  disabled,
}: InterviewTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Interview Type</label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as InterviewType)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select interview type" />
        </SelectTrigger>
        <SelectContent>
          {INTERVIEW_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {INTERVIEW_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {INTERVIEW_TYPE_DESCRIPTIONS[value]}
      </p>
    </div>
  )
}
