from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.complaint import ComplaintCreate, ComplaintFields, ComplaintRecord, ComplaintSummaryOut, RiskAssessmentOut
from app.services.complaint_service import ComplaintService
from app.services.risk_service import RiskService
from app.db.session import get_db

router = APIRouter()


@router.post("/complaints", response_model=ComplaintRecord)
@router.post("/complaint", response_model=ComplaintRecord)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)) -> ComplaintRecord:
    return ComplaintService(db).create(payload)


@router.get("/complaints/{complaint_id}", response_model=ComplaintRecord)
@router.get("/complaint/{complaint_id}", response_model=ComplaintRecord)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)) -> ComplaintRecord:
    record = ComplaintService(db).get(complaint_id)
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return record


@router.put("/complaints/{complaint_id}", response_model=ComplaintRecord)
@router.put("/complaint/{complaint_id}", response_model=ComplaintRecord)
def update_complaint(complaint_id: str, payload: ComplaintCreate, db: Session = Depends(get_db)) -> ComplaintRecord:
    record = ComplaintService(db).update(complaint_id, payload)
    if not record:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return record


@router.post("/risk", response_model=RiskAssessmentOut)
def risk(fields: ComplaintFields) -> RiskAssessmentOut:
    return RiskService().assess(fields)


@router.post("/summary", response_model=ComplaintSummaryOut)
def summary(fields: ComplaintFields) -> ComplaintSummaryOut:
    risk_result = RiskService().assess(fields)
    return RiskService().summary(fields, risk_result)
