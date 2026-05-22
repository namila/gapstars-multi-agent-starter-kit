"use client"

import { useRef } from "react"
import { FileText, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useFileUpload } from "@/hooks/use-file-upload"
import { cn } from "@/lib/utils"

interface ResumeUploadProps {
  file: File | null
  onFileChange: (file: File | null) => void
  disabled?: boolean
}

export function ResumeUpload({ file, onFileChange, disabled }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    isDragging,
    error,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    clearFile,
    setFile,
  } = useFileUpload({
    accept: ".pdf",
    maxSize: 10 * 1024 * 1024, // 10MB
    onError: (err) => console.error("File upload error:", err),
  })

  // Sync with parent state
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e)
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileChange(selectedFile)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    handleDrop(e)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.name.toLowerCase().endsWith(".pdf")) {
      onFileChange(droppedFile)
    }
  }

  const handleClear = () => {
    clearFile()
    onFileChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Resume (PDF)</label>

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Remove file"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
              inputRef.current?.click()
            }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleFileDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">
              {isDragging ? "Drop your resume here" : "Upload resume"}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to browse
            </p>
          </div>
          <p className="text-xs text-muted-foreground">PDF files only, up to 10MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        aria-label="Upload resume PDF"
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
