from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ComplaintFields(BaseModel):
    complaint_source: str = ""
    customer_name: str = ""
    product_name: str = ""
    product_strength: str = ""
    batch_lot_number: str = ""
    manufacturing_date: str = ""
    expiry_date: str = ""
    affected_quantity: str = ""
    facility: str = ""
    material: str = ""
    complaint_category: str = ""
    complaint_description: str = ""

    model_config = ConfigDict(extra="ignore")

    def non_empty_patch(self) -> dict[str, str]:
        return {key: value for key, value in self.model_dump().items() if value}


class RiskAssessmentOut(BaseModel):
    severity: str = ""
    priority: str = ""
    initial_risk: str = ""
    suggested_next_action: str = ""
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    reasoning: str = ""
    root_cause_recommendation: str = ""
    suggested_capa: str = ""
    suggested_investigation: str = ""


class CompletenessReport(BaseModel):
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    missing_fields: list[str] = Field(default_factory=list)
    ready_to_commit: bool = False


class ComplaintSummaryOut(BaseModel):
    title: str = ""
    narrative: str = ""
    duplicate_score: float = Field(default=0.0, ge=0.0, le=1.0)
    completeness: CompletenessReport = Field(default_factory=CompletenessReport)
    root_cause_recommendation: str = ""
    suggested_capa: str = ""
    suggested_investigation: str = ""


class ComplaintCreate(BaseModel):
    fields: ComplaintFields
    risk: RiskAssessmentOut | None = None
    summary: ComplaintSummaryOut | None = None


class ComplaintUpdate(BaseModel):
    fields: ComplaintFields
    risk: RiskAssessmentOut | None = None
    summary: ComplaintSummaryOut | None = None


class ComplaintRecord(BaseModel):
    id: str
    fields: ComplaintFields
    risk: RiskAssessmentOut | None = None
    summary: ComplaintSummaryOut | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApiEnvelope(BaseModel):
    data: Any

