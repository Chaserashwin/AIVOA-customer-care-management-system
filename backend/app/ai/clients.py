from __future__ import annotations

import json
import re
from typing import Any

from app.ai.heuristics import extract_complaint_fields
from app.ai.prompts import COMPLAINT_EXTRACTION_SYSTEM_PROMPT
from app.core.config import Settings, get_settings


class ComplaintLLMClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def extract(self, text: str, *, source_hint: str | None = None) -> dict[str, str]:
        if not self.settings.groq_api_key:
            return extract_complaint_fields(text, source_hint=source_hint)

        try:
            from langchain_groq import ChatGroq

            llm = ChatGroq(
                groq_api_key=self.settings.groq_api_key,
                model_name=self.settings.groq_small_model,
                temperature=0,
            )
            response = llm.invoke(
                [
                    ("system", COMPLAINT_EXTRACTION_SYSTEM_PROMPT),
                    ("human", text),
                ]
            )
            parsed = _json_from_text(str(response.content))
            fallback = extract_complaint_fields(text, source_hint=source_hint)
            return {**fallback, **{key: value for key, value in parsed.items() if value}}
        except Exception:
            return extract_complaint_fields(text, source_hint=source_hint)


def _json_from_text(text: str) -> dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.S)
        if not match:
            return {}
        return json.loads(match.group(0))
