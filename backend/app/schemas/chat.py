from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.complaint import ComplaintFields, ComplaintSummaryOut, RiskAssessmentOut


class ChatRequest(BaseModel):
    message: str = ""
    conversation_id: str | None = None
    complaint: ComplaintFields = Field(default_factory=ComplaintFields)


class ChatFinalResponse(BaseModel):
    conversation_id: str
    intent: str
    assistant_response: str
    complaint: ComplaintFields
    risk: RiskAssessmentOut
    summary: ComplaintSummaryOut
    updated_fields: list[str] = Field(default_factory=list)
    status: str = "Pending Triage"
    redux_sync: dict = Field(default_factory=dict)


class UploadResponse(BaseModel):
    file_name: str
    file_type: str
    extracted_text_preview: str
    result: ChatFinalResponse

