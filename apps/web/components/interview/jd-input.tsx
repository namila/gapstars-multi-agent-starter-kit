"use client"

import { Textarea } from "@/components/ui/textarea"

interface JDInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function JDInput({ value, onChange, disabled }: JDInputProps) {
  const charCount = value.length
  const isValid = charCount >= 50

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="job-description" className="text-sm font-medium">
          Job Description
        </label>
        <span
          className={`text-xs ${
            isValid ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {charCount} characters {!isValid && "(minimum 50)"}
        </span>
      </div>
      <Textarea
        id="job-description"
        placeholder="Paste the job description here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[200px] resize-y"
      />
      <p className="text-xs text-muted-foreground">
        Include the full job posting with requirements, responsibilities, and qualifications.
      </p>
    </div>
  )
}
