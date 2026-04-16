"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type LLMProvider, PROVIDER_LABELS } from "@/lib/types"

interface ProviderSelectorProps {
  value: LLMProvider
  onChange: (provider: LLMProvider) => void
  disabled?: boolean
}

const PROVIDER_ICONS: Record<LLMProvider, string> = {
  openai: "⬛",
  mistral: "🟠",
}

export function ProviderSelector({ value, onChange, disabled }: ProviderSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as LLMProvider)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-36 text-xs">
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span>{PROVIDER_ICONS[value]}</span>
            <span>{PROVIDER_LABELS[value]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(PROVIDER_LABELS) as LLMProvider[]).map((p) => (
          <SelectItem key={p} value={p} className="text-xs">
            <span className="flex items-center gap-1.5">
              <span>{PROVIDER_ICONS[p]}</span>
              <span>{PROVIDER_LABELS[p]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
