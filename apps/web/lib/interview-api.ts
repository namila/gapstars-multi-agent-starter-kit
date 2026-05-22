/**
 * Interview generator API functions
 */

import { createParser } from "eventsource-parser"

import { API_URL, type LLMProvider } from "@/lib/types"
import type {
  AgentProgressEvent,
  InterviewPackage,
  InterviewStreamChunk,
  InterviewType,
} from "@/lib/interview-types"

export interface GenerateInterviewParams {
  jobDescription: string
  resumeFile: File
  interviewType: InterviewType
  provider?: LLMProvider
  threadId?: string
}

/**
 * Stream interview generation with progress events
 */
export async function* streamInterviewGeneration(
  params: GenerateInterviewParams
): AsyncGenerator<InterviewStreamChunk, void, unknown> {
  const formData = new FormData()
  formData.append("job_description", params.jobDescription)
  formData.append("resume", params.resumeFile)
  formData.append("interview_type", params.interviewType)

  if (params.provider) {
    formData.append("provider", params.provider)
  }
  if (params.threadId) {
    formData.append("thread_id", params.threadId)
  }

  const response = await fetch(`${API_URL}/api/interview/generate`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let detail = `API error: ${response.status} ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      detail = errorJson.detail || detail
    } catch {
      // Use default error message
    }
    throw new Error(detail)
  }

  if (!response.body) {
    throw new Error("Response body is null")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  // Buffer for chunks
  const buffer: InterviewStreamChunk[] = []
  let resolveNext: ((value: IteratorResult<InterviewStreamChunk>) => void) | null = null
  let streamDone = false

  function push(chunk: InterviewStreamChunk) {
    if (resolveNext) {
      const r = resolveNext
      resolveNext = null
      r({ value: chunk, done: false })
    } else {
      buffer.push(chunk)
    }
  }

  function finish() {
    streamDone = true
    if (resolveNext) {
      const r = resolveNext
      resolveNext = null
      r({ value: undefined as unknown as InterviewStreamChunk, done: true })
    }
  }

  // Create SSE parser
  const parser = createParser({
    onEvent(event) {
      try {
        const data = JSON.parse(event.data)

        switch (event.event) {
          case "progress":
            push({ type: "progress", data: data as AgentProgressEvent })
            break
          case "result":
            push({
              type: "result",
              data: data as { thread_id: string; provider: string; package: InterviewPackage },
            })
            break
          case "error":
            push({ type: "error", data: data as { detail: string } })
            break
          case "done":
            push({ type: "done", data: data as { thread_id: string; provider: string } })
            break
        }
      } catch {
        // Ignore non-JSON events
      }
    },
  })

  // Read stream in background
  const reading = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        parser.feed(decoder.decode(value, { stream: true }))
      }
    } finally {
      finish()
    }
  })()

  // Yield from buffer
  for (;;) {
    if (buffer.length > 0) {
      yield buffer.shift()!
    } else if (streamDone) {
      break
    } else {
      const result = await new Promise<IteratorResult<InterviewStreamChunk>>((resolve) => {
        resolveNext = resolve
      })
      if (result.done) break
      yield result.value
    }
  }

  await reading
}

/**
 * Get available interview types
 */
export async function getInterviewTypes(): Promise<
  Array<{ value: InterviewType; label: string }>
> {
  const response = await fetch(`${API_URL}/api/interview/types`)

  if (!response.ok) {
    throw new Error(`Failed to fetch interview types: ${response.statusText}`)
  }

  const data = await response.json()
  return data.types
}

/**
 * Get a previously generated interview package
 */
export async function getInterview(threadId: string): Promise<{
  thread_id: string
  package: InterviewPackage
}> {
  const response = await fetch(`${API_URL}/api/interview/${threadId}`)

  if (!response.ok) {
    const errorText = await response.text()
    let detail = `Failed to fetch interview: ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      detail = errorJson.detail || detail
    } catch {
      // Use default error message
    }
    throw new Error(detail)
  }

  return response.json()
}
