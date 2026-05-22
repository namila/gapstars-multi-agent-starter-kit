"""PDF text extraction utility."""

from __future__ import annotations

import io
import logging

from pypdf import PdfReader

from api.interview.utils.text_sanitizer import sanitize_text

logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text content from a PDF file.

    Args:
        pdf_bytes: Raw bytes of the PDF file.

    Returns:
        Extracted text content as a single string.

    Raises:
        ValueError: If the PDF cannot be read or contains no extractable text.
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as exc:
        logger.exception("Failed to read PDF")
        raise ValueError(f"Could not read PDF file: {exc}") from exc

    if len(reader.pages) == 0:
        raise ValueError("PDF file contains no pages")

    text_parts: list[str] = []

    for page_num, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        except Exception as exc:
            logger.warning(f"Failed to extract text from page {page_num}: {exc}")
            # Continue with other pages

    if not text_parts:
        raise ValueError("Could not extract any text from the PDF")

    full_text = "\n\n".join(text_parts)
    full_text = sanitize_text(full_text)
    logger.info(f"Extracted {len(full_text)} characters from {len(reader.pages)} pages")

    return full_text
