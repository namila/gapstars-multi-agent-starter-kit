"use client"

import { useCallback, useState, type DragEvent, type ChangeEvent } from "react"

export interface UseFileUploadOptions {
  accept?: string
  maxSize?: number // bytes
  onError?: (error: string) => void
}

export interface UseFileUploadReturn {
  file: File | null
  fileName: string | null
  isDragging: boolean
  error: string | null
  handleDragEnter: (e: DragEvent) => void
  handleDragLeave: (e: DragEvent) => void
  handleDragOver: (e: DragEvent) => void
  handleDrop: (e: DragEvent) => void
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void
  clearFile: () => void
  setFile: (file: File | null) => void
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { accept = ".pdf", maxSize = 10 * 1024 * 1024, onError } = options // 10MB default

  const [file, setFileState] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback(
    (f: File): string | null => {
      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase())
        const fileExt = `.${f.name.split(".").pop()?.toLowerCase()}`
        const fileMime = f.type.toLowerCase()

        const isAccepted = acceptedTypes.some(
          (t) => t === fileExt || t === fileMime || (t.endsWith("/*") && fileMime.startsWith(t.slice(0, -1)))
        )

        if (!isAccepted) {
          return `File type not accepted. Please upload a ${accept} file.`
        }
      }

      // Check file size
      if (maxSize && f.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024))
        return `File is too large. Maximum size is ${maxMB}MB.`
      }

      return null
    },
    [accept, maxSize]
  )

  const setFile = useCallback(
    (f: File | null) => {
      if (f) {
        const validationError = validateFile(f)
        if (validationError) {
          setError(validationError)
          onError?.(validationError)
          return
        }
      }
      setError(null)
      setFileState(f)
    },
    [validateFile, onError]
  )

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        setFile(droppedFiles[0])
      }
    },
    [setFile]
  )

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        setFile(selectedFiles[0])
      }
    },
    [setFile]
  )

  const clearFile = useCallback(() => {
    setFileState(null)
    setError(null)
  }, [])

  return {
    file,
    fileName: file?.name ?? null,
    isDragging,
    error,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    clearFile,
    setFile,
  }
}
