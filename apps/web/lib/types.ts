export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export type LLMProvider = "openai" | "mistral"

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openai: "OpenAI",
  mistral: "Mistral",
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  provider?: LLMProvider
  createdAt: Date
}

export interface StreamChunk {
  token?: string
  thread_id?: string
  provider?: LLMProvider
  detail?: string
}
