import { useState, useCallback } from "react"
import type { InterviewPackage } from "@/lib/interview-types"
import { downloadInterviewPDF } from "@/lib/pdf-generator"

interface UsePDFExportReturn {
  isGenerating: boolean
  error: string | null
  downloadPDF: (pkg: InterviewPackage, filename?: string) => Promise<void>
}

export function usePDFExport(): UsePDFExportReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const downloadPDF = useCallback(
    async (pkg: InterviewPackage, filename?: string): Promise<void> => {
      setIsGenerating(true)
      setError(null)

      try {
        // Small delay to allow UI to update with loading state
        await new Promise((resolve) => setTimeout(resolve, 100))
        downloadInterviewPDF(pkg, filename)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to generate PDF"
        setError(message)
        throw err
      } finally {
        setIsGenerating(false)
      }
    },
    []
  )

  return {
    isGenerating,
    error,
    downloadPDF,
  }
}
