"use client"

import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePDFExport } from "@/hooks/use-pdf-export"
import type { InterviewPackage } from "@/lib/interview-types"

interface ExportActionsProps {
  package: InterviewPackage
}

export function ExportActions({ package: pkg }: ExportActionsProps) {
  const { isGenerating, error, downloadPDF } = usePDFExport()

  const handleDownload = async () => {
    const filename = `interview-${pkg.parsed_jd.title.toLowerCase().replace(/\s+/g, "-")}-${pkg.parsed_resume.name?.toLowerCase().replace(/\s+/g, "-") || "candidate"}.pdf`
    await downloadPDF(pkg, filename)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="mr-2 size-4" />
            Download PDF
          </>
        )}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  )
}
