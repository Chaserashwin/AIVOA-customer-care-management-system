from __future__ import annotations

from typing import Any, Literal, TypedDict


Intent = Literal["new_complaint", "correction", "pdf_upload", "question_answering"]


class ComplaintGraphState(TypedDict, total=False):
    conversation_id: str
    message: str
    uploaded_text: str
    source_hint: str
    forced_intent: Intent
    intent: Intent
    current_complaint: dict[str, Any]
    extraction: dict[str, Any]
    validated_patch: dict[str, Any]
    complaint: dict[str, Any]
    updated_fields: list[str]
    risk: dict[str, Any]
    summary: dict[str, Any]
    assistant_response: str
    redux_sync: dict[str, Any]
    status: str
