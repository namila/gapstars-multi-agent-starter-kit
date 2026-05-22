"""Interview agent prompt templates."""

from api.interview.prompts.jd_parser import JD_PARSER_PROMPT
from api.interview.prompts.matching import MATCHING_PROMPT
from api.interview.prompts.question_generator import QUESTION_GENERATOR_PROMPT
from api.interview.prompts.resume_parser import RESUME_PARSER_PROMPT
from api.interview.prompts.rubric_generator import RUBRIC_GENERATOR_PROMPT
from api.interview.prompts.structure_composer import STRUCTURE_COMPOSER_PROMPT

__all__ = [
    "JD_PARSER_PROMPT",
    "RESUME_PARSER_PROMPT",
    "MATCHING_PROMPT",
    "QUESTION_GENERATOR_PROMPT",
    "STRUCTURE_COMPOSER_PROMPT",
    "RUBRIC_GENERATOR_PROMPT",
]
