import { jsPDF } from "jspdf"
import type {
  InterviewPackage,
  Question,
  InterviewSection,
  ScoringArea,
} from "./interview-types"
import { INTERVIEW_TYPE_LABELS } from "./interview-types"

// PDF Configuration
const CONFIG = {
  margins: { top: 20, right: 20, bottom: 25, left: 20 },
  fonts: {
    title: 24,
    heading: 16,
    subheading: 12,
    body: 10,
    small: 9,
  },
  colors: {
    primary: [41, 98, 255] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    gray: [107, 114, 128] as [number, number, number],
    lightGray: [229, 231, 235] as [number, number, number],
    black: [0, 0, 0] as [number, number, number],
  },
  lineHeight: 1.4,
  pageWidth: 210,
  pageHeight: 297,
}

const getContentWidth = () =>
  CONFIG.pageWidth - CONFIG.margins.left - CONFIG.margins.right

/**
 * Wrap text to fit within a given width
 */
function wrapText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  doc.setFontSize(fontSize)
  return doc.splitTextToSize(text, maxWidth)
}

/**
 * Check if we need a page break and add one if necessary
 */
function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  neededHeight: number
): number {
  const maxY = CONFIG.pageHeight - CONFIG.margins.bottom
  if (currentY + neededHeight > maxY) {
    doc.addPage()
    addPageNumber(doc)
    return CONFIG.margins.top
  }
  return currentY
}

/**
 * Add page number to current page
 */
function addPageNumber(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(CONFIG.fonts.small)
  doc.setTextColor(...CONFIG.colors.gray)
  doc.text(
    `Page ${pageCount}`,
    CONFIG.pageWidth / 2,
    CONFIG.pageHeight - 10,
    { align: "center" }
  )
  doc.setTextColor(...CONFIG.colors.black)
}

/**
 * Draw a horizontal line
 */
function drawLine(doc: jsPDF, y: number): void {
  doc.setDrawColor(...CONFIG.colors.lightGray)
  doc.line(CONFIG.margins.left, y, CONFIG.pageWidth - CONFIG.margins.right, y)
}

/**
 * Generate the cover page
 */
function generateCoverPage(doc: jsPDF, pkg: InterviewPackage): void {
  const centerX = CONFIG.pageWidth / 2

  // Title
  doc.setFontSize(CONFIG.fonts.title)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...CONFIG.colors.primary)
  doc.text("Interview Package", centerX, 60, { align: "center" })

  // Job Title
  doc.setFontSize(CONFIG.fonts.heading)
  doc.setTextColor(...CONFIG.colors.black)
  doc.text(pkg.parsed_jd.title, centerX, 80, { align: "center" })

  // Divider
  drawLine(doc, 95)

  // Details
  let y = 115
  doc.setFontSize(CONFIG.fonts.body)
  doc.setFont("helvetica", "normal")

  const details = [
    ["Candidate", pkg.parsed_resume.name || "Not specified"],
    ["Interview Type", INTERVIEW_TYPE_LABELS[pkg.interview_type]],
    ["Duration", `${pkg.total_duration_minutes} minutes`],
    ["Match Score", `${pkg.gap_analysis.overall_match_score}%`],
    ["Questions", `${pkg.questions.length}`],
    ["Sections", `${pkg.structure.length}`],
    ["Generated", new Date().toLocaleDateString()],
  ]

  for (const [label, value] of details) {
    doc.setFont("helvetica", "bold")
    doc.text(`${label}:`, centerX - 40, y)
    doc.setFont("helvetica", "normal")
    doc.text(value, centerX + 10, y)
    y += 10
  }

  addPageNumber(doc)
}

/**
 * Generate the executive summary page
 */
function generateExecutiveSummary(doc: jsPDF, pkg: InterviewPackage): number {
  doc.addPage()
  let y = CONFIG.margins.top

  // Title
  doc.setFontSize(CONFIG.fonts.heading)
  doc.setFont("helvetica", "bold")
  doc.text("Executive Summary", CONFIG.margins.left, y)
  y += 15

  // Match Score
  doc.setFontSize(CONFIG.fonts.subheading)
  doc.setTextColor(...CONFIG.colors.primary)
  doc.text(
    `Overall Match Score: ${pkg.gap_analysis.overall_match_score}%`,
    CONFIG.margins.left,
    y
  )
  doc.setTextColor(...CONFIG.colors.black)
  y += 15

  // Strengths
  if (pkg.gap_analysis.strengths.length > 0) {
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...CONFIG.colors.success)
    doc.text("Strengths", CONFIG.margins.left, y)
    doc.setTextColor(...CONFIG.colors.black)
    y += 8

    for (const strength of pkg.gap_analysis.strengths) {
      y = checkPageBreak(doc, y, 20)
      doc.setFontSize(CONFIG.fonts.body)
      doc.setFont("helvetica", "bold")
      const areaLines = wrapText(
        doc,
        `• ${strength.area}`,
        getContentWidth(),
        CONFIG.fonts.body
      )
      doc.text(areaLines, CONFIG.margins.left, y)
      y += areaLines.length * 5

      doc.setFont("helvetica", "normal")
      doc.setTextColor(...CONFIG.colors.gray)
      const evidenceLines = wrapText(
        doc,
        strength.evidence,
        getContentWidth() - 10,
        CONFIG.fonts.small
      )
      doc.text(evidenceLines, CONFIG.margins.left + 5, y)
      doc.setTextColor(...CONFIG.colors.black)
      y += evidenceLines.length * 4 + 5
    }
    y += 5
  }

  // Areas to Probe
  if (pkg.gap_analysis.skill_gaps.length > 0) {
    y = checkPageBreak(doc, y, 20)
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...CONFIG.colors.warning)
    doc.text("Areas to Probe", CONFIG.margins.left, y)
    doc.setTextColor(...CONFIG.colors.black)
    y += 8

    for (const gap of pkg.gap_analysis.skill_gaps) {
      y = checkPageBreak(doc, y, 20)
      doc.setFontSize(CONFIG.fonts.body)
      doc.setFont("helvetica", "bold")
      doc.text(
        `• ${gap.skill} (${gap.gap_severity})`,
        CONFIG.margins.left,
        y
      )
      y += 5

      doc.setFont("helvetica", "normal")
      doc.setTextColor(...CONFIG.colors.gray)
      const focusLines = wrapText(
        doc,
        gap.interview_focus,
        getContentWidth() - 10,
        CONFIG.fonts.small
      )
      doc.text(focusLines, CONFIG.margins.left + 5, y)
      doc.setTextColor(...CONFIG.colors.black)
      y += focusLines.length * 4 + 5
    }
    y += 5
  }

  // Focus Areas
  if (pkg.gap_analysis.focus_areas.length > 0) {
    y = checkPageBreak(doc, y, 20)
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.text("Focus Areas", CONFIG.margins.left, y)
    y += 8

    doc.setFontSize(CONFIG.fonts.body)
    doc.setFont("helvetica", "normal")
    const focusText = pkg.gap_analysis.focus_areas.join(", ")
    const focusLines = wrapText(doc, focusText, getContentWidth(), CONFIG.fonts.body)
    doc.text(focusLines, CONFIG.margins.left, y)
    y += focusLines.length * 5 + 5
  }

  // Recommendations
  if (pkg.gap_analysis.recommendations.length > 0) {
    y = checkPageBreak(doc, y, 20)
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.text("Recommendations", CONFIG.margins.left, y)
    y += 8

    doc.setFontSize(CONFIG.fonts.body)
    doc.setFont("helvetica", "normal")
    for (const rec of pkg.gap_analysis.recommendations) {
      y = checkPageBreak(doc, y, 15)
      const recLines = wrapText(doc, `• ${rec}`, getContentWidth(), CONFIG.fonts.body)
      doc.text(recLines, CONFIG.margins.left, y)
      y += recLines.length * 5 + 2
    }
  }

  addPageNumber(doc)
  return y
}

/**
 * Generate interview structure section
 */
function generateStructure(
  doc: jsPDF,
  structure: InterviewSection[],
  questions: Question[]
): void {
  doc.addPage()
  let y = CONFIG.margins.top

  doc.setFontSize(CONFIG.fonts.heading)
  doc.setFont("helvetica", "bold")
  doc.text("Interview Structure", CONFIG.margins.left, y)
  y += 15

  for (const section of structure) {
    y = checkPageBreak(doc, y, 40)

    // Section header
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...CONFIG.colors.primary)
    doc.text(section.name, CONFIG.margins.left, y)
    doc.setTextColor(...CONFIG.colors.black)
    y += 6

    // Duration
    doc.setFontSize(CONFIG.fonts.small)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...CONFIG.colors.gray)
    doc.text(`Duration: ${section.duration_minutes} minutes`, CONFIG.margins.left, y)
    doc.setTextColor(...CONFIG.colors.black)
    y += 6

    // Description
    doc.setFontSize(CONFIG.fonts.body)
    const descLines = wrapText(
      doc,
      section.description,
      getContentWidth(),
      CONFIG.fonts.body
    )
    doc.text(descLines, CONFIG.margins.left, y)
    y += descLines.length * 5 + 3

    // Questions in this section
    const sectionQuestions = questions.filter((q) =>
      section.question_ids.includes(q.id)
    )
    if (sectionQuestions.length > 0) {
      doc.setFontSize(CONFIG.fonts.small)
      doc.setTextColor(...CONFIG.colors.gray)
      doc.text(
        `Questions: ${sectionQuestions.length}`,
        CONFIG.margins.left,
        y
      )
      doc.setTextColor(...CONFIG.colors.black)
      y += 5
    }

    // Interviewer notes
    if (section.interviewer_notes.length > 0) {
      doc.setFontSize(CONFIG.fonts.small)
      doc.setFont("helvetica", "italic")
      for (const note of section.interviewer_notes) {
        y = checkPageBreak(doc, y, 10)
        const noteLines = wrapText(
          doc,
          `Note: ${note}`,
          getContentWidth() - 5,
          CONFIG.fonts.small
        )
        doc.text(noteLines, CONFIG.margins.left + 5, y)
        y += noteLines.length * 4 + 2
      }
      doc.setFont("helvetica", "normal")
    }

    y += 10
    drawLine(doc, y - 5)
  }

  addPageNumber(doc)
}

/**
 * Generate question bank section
 */
function generateQuestions(doc: jsPDF, questions: Question[]): void {
  doc.addPage()
  let y = CONFIG.margins.top

  doc.setFontSize(CONFIG.fonts.heading)
  doc.setFont("helvetica", "bold")
  doc.text("Question Bank", CONFIG.margins.left, y)
  y += 15

  // Group questions by category
  const byCategory = questions.reduce(
    (acc, q) => {
      if (!acc[q.category]) acc[q.category] = []
      acc[q.category].push(q)
      return acc
    },
    {} as Record<string, Question[]>
  )

  for (const [category, categoryQuestions] of Object.entries(byCategory)) {
    y = checkPageBreak(doc, y, 30)

    // Category header
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...CONFIG.colors.primary)
    doc.text(category, CONFIG.margins.left, y)
    doc.setTextColor(...CONFIG.colors.black)
    y += 10

    for (const question of categoryQuestions) {
      y = checkPageBreak(doc, y, 50)

      // Question
      doc.setFontSize(CONFIG.fonts.body)
      doc.setFont("helvetica", "bold")
      const qLines = wrapText(
        doc,
        question.question,
        getContentWidth(),
        CONFIG.fonts.body
      )
      doc.text(qLines, CONFIG.margins.left, y)
      y += qLines.length * 5 + 3

      // Metadata
      doc.setFontSize(CONFIG.fonts.small)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...CONFIG.colors.gray)
      const difficultyColor =
        question.difficulty === "hard"
          ? CONFIG.colors.danger
          : question.difficulty === "medium"
            ? CONFIG.colors.warning
            : CONFIG.colors.success
      doc.setTextColor(...difficultyColor)
      doc.text(
        `${question.difficulty.toUpperCase()}`,
        CONFIG.margins.left,
        y
      )
      doc.setTextColor(...CONFIG.colors.gray)
      doc.text(
        ` | ${question.time_minutes} min`,
        CONFIG.margins.left + 25,
        y
      )
      doc.setTextColor(...CONFIG.colors.black)
      y += 6

      // Follow-ups
      if (question.follow_ups.length > 0) {
        doc.setFontSize(CONFIG.fonts.small)
        doc.setFont("helvetica", "bold")
        doc.text("Follow-ups:", CONFIG.margins.left + 5, y)
        y += 4
        doc.setFont("helvetica", "normal")
        for (const followUp of question.follow_ups.slice(0, 3)) {
          y = checkPageBreak(doc, y, 10)
          const fuLines = wrapText(
            doc,
            `- ${followUp}`,
            getContentWidth() - 15,
            CONFIG.fonts.small
          )
          doc.text(fuLines, CONFIG.margins.left + 10, y)
          y += fuLines.length * 4 + 1
        }
        y += 2
      }

      // What to look for
      if (question.what_to_look_for.length > 0) {
        y = checkPageBreak(doc, y, 15)
        doc.setFontSize(CONFIG.fonts.small)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...CONFIG.colors.success)
        doc.text("What to look for:", CONFIG.margins.left + 5, y)
        doc.setTextColor(...CONFIG.colors.black)
        y += 4
        doc.setFont("helvetica", "normal")
        for (const item of question.what_to_look_for.slice(0, 3)) {
          y = checkPageBreak(doc, y, 10)
          const itemLines = wrapText(
            doc,
            `+ ${item}`,
            getContentWidth() - 15,
            CONFIG.fonts.small
          )
          doc.text(itemLines, CONFIG.margins.left + 10, y)
          y += itemLines.length * 4 + 1
        }
        y += 2
      }

      // Red flags
      if (question.red_flags.length > 0) {
        y = checkPageBreak(doc, y, 15)
        doc.setFontSize(CONFIG.fonts.small)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...CONFIG.colors.danger)
        doc.text("Red flags:", CONFIG.margins.left + 5, y)
        doc.setTextColor(...CONFIG.colors.black)
        y += 4
        doc.setFont("helvetica", "normal")
        for (const flag of question.red_flags.slice(0, 3)) {
          y = checkPageBreak(doc, y, 10)
          const flagLines = wrapText(
            doc,
            `! ${flag}`,
            getContentWidth() - 15,
            CONFIG.fonts.small
          )
          doc.text(flagLines, CONFIG.margins.left + 10, y)
          y += flagLines.length * 4 + 1
        }
      }

      y += 8
      drawLine(doc, y - 4)
    }
    y += 5
  }

  addPageNumber(doc)
}

/**
 * Generate scoring rubric section
 */
function generateRubric(doc: jsPDF, rubric: ScoringArea[]): void {
  doc.addPage()
  let y = CONFIG.margins.top

  doc.setFontSize(CONFIG.fonts.heading)
  doc.setFont("helvetica", "bold")
  doc.text("Scoring Rubric", CONFIG.margins.left, y)
  y += 15

  for (const area of rubric) {
    y = checkPageBreak(doc, y, 40)

    // Area header
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...CONFIG.colors.primary)
    doc.text(`${area.area} (Weight: ${area.weight}%)`, CONFIG.margins.left, y)
    doc.setTextColor(...CONFIG.colors.black)
    y += 6

    // Pass threshold
    doc.setFontSize(CONFIG.fonts.small)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...CONFIG.colors.gray)
    doc.text(`Pass threshold: ${area.pass_threshold}/5`, CONFIG.margins.left, y)
    doc.setTextColor(...CONFIG.colors.black)
    y += 8

    // Criteria
    for (const criterion of area.criteria) {
      y = checkPageBreak(doc, y, 30)

      doc.setFontSize(CONFIG.fonts.body)
      doc.setFont("helvetica", "bold")
      doc.text(
        `${criterion.criterion} (${criterion.weight}%)`,
        CONFIG.margins.left + 5,
        y
      )
      y += 5

      // Indicators
      doc.setFontSize(CONFIG.fonts.small)
      doc.setFont("helvetica", "normal")
      const indicatorKeys = Object.keys(criterion.indicators).sort()
      for (const key of indicatorKeys) {
        y = checkPageBreak(doc, y, 10)
        const indicator = criterion.indicators[key]
        const indicatorLines = wrapText(
          doc,
          `${key}: ${indicator}`,
          getContentWidth() - 20,
          CONFIG.fonts.small
        )
        doc.text(indicatorLines, CONFIG.margins.left + 10, y)
        y += indicatorLines.length * 4 + 1
      }
      y += 4
    }

    y += 5
    drawLine(doc, y - 3)
    y += 5
  }

  addPageNumber(doc)
}

/**
 * Generate interviewer notes section
 */
function generateInterviewerNotes(doc: jsPDF, pkg: InterviewPackage): void {
  doc.addPage()
  let y = CONFIG.margins.top

  doc.setFontSize(CONFIG.fonts.heading)
  doc.setFont("helvetica", "bold")
  doc.text("Interviewer Notes", CONFIG.margins.left, y)
  y += 15

  const { guidance } = pkg

  // Opening script
  if (guidance.opening_script) {
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.text("Opening Script", CONFIG.margins.left, y)
    y += 8

    doc.setFontSize(CONFIG.fonts.body)
    doc.setFont("helvetica", "normal")
    const openingLines = wrapText(
      doc,
      guidance.opening_script,
      getContentWidth(),
      CONFIG.fonts.body
    )
    doc.text(openingLines, CONFIG.margins.left, y)
    y += openingLines.length * 5 + 10
  }

  // Candidate-specific notes
  if (guidance.candidate_specific_notes.length > 0) {
    y = checkPageBreak(doc, y, 30)
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.text("Candidate-Specific Notes", CONFIG.margins.left, y)
    y += 8

    doc.setFontSize(CONFIG.fonts.body)
    doc.setFont("helvetica", "normal")
    for (const note of guidance.candidate_specific_notes) {
      y = checkPageBreak(doc, y, 15)
      const noteLines = wrapText(
        doc,
        `• ${note}`,
        getContentWidth(),
        CONFIG.fonts.body
      )
      doc.text(noteLines, CONFIG.margins.left, y)
      y += noteLines.length * 5 + 3
    }
    y += 5
  }

  // Time management tips
  if (guidance.time_management_tips.length > 0) {
    y = checkPageBreak(doc, y, 30)
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.text("Time Management Tips", CONFIG.margins.left, y)
    y += 8

    doc.setFontSize(CONFIG.fonts.body)
    doc.setFont("helvetica", "normal")
    for (const tip of guidance.time_management_tips) {
      y = checkPageBreak(doc, y, 15)
      const tipLines = wrapText(
        doc,
        `• ${tip}`,
        getContentWidth(),
        CONFIG.fonts.body
      )
      doc.text(tipLines, CONFIG.margins.left, y)
      y += tipLines.length * 5 + 3
    }
    y += 5
  }

  // Closing script
  if (guidance.closing_script) {
    y = checkPageBreak(doc, y, 30)
    doc.setFontSize(CONFIG.fonts.subheading)
    doc.setFont("helvetica", "bold")
    doc.text("Closing Script", CONFIG.margins.left, y)
    y += 8

    doc.setFontSize(CONFIG.fonts.body)
    doc.setFont("helvetica", "normal")
    const closingLines = wrapText(
      doc,
      guidance.closing_script,
      getContentWidth(),
      CONFIG.fonts.body
    )
    doc.text(closingLines, CONFIG.margins.left, y)
  }

  addPageNumber(doc)
}

/**
 * Main function to generate the complete interview PDF
 */
export function generateInterviewPDF(pkg: InterviewPackage): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Generate all sections
  generateCoverPage(doc, pkg)
  generateExecutiveSummary(doc, pkg)
  generateStructure(doc, pkg.structure, pkg.questions)
  generateQuestions(doc, pkg.questions)
  generateRubric(doc, pkg.rubric)
  generateInterviewerNotes(doc, pkg)

  return doc
}

/**
 * Generate and download the PDF
 */
export function downloadInterviewPDF(
  pkg: InterviewPackage,
  filename?: string
): void {
  const doc = generateInterviewPDF(pkg)
  const name =
    filename ||
    `interview-${pkg.parsed_jd.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`
  doc.save(name)
}
