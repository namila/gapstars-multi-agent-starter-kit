"""Text sanitization utility for safe database storage."""

from __future__ import annotations

import re
import unicodedata


def sanitize_text(text: str) -> str:
    """Sanitize text for safe database storage.

    - Normalizes unicode to NFC form
    - Removes null bytes (PostgreSQL incompatible)
    - Removes other control characters (except newlines/tabs)
    - Normalizes whitespace

    Args:
        text: The text to sanitize.

    Returns:
        Sanitized text safe for database storage.
    """
    if not text:
        return text

    # Unicode normalization (NFC - Canonical Decomposition, followed by Canonical Composition)
    text = unicodedata.normalize("NFC", text)

    # Remove null bytes (PostgreSQL cannot store these)
    text = text.replace("\x00", "")

    # Remove control characters except newline (\n), carriage return (\r), and tab (\t)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Normalize multiple spaces/tabs to single space (preserve newlines)
    text = re.sub(r"[^\S\n]+", " ", text)

    # Remove leading/trailing whitespace from each line
    text = "\n".join(line.strip() for line in text.split("\n"))

    # Remove excessive blank lines (more than 2 consecutive)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()
