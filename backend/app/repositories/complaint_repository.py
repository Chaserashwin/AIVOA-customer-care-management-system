from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AuditLog, Complaint, Customer, RiskAssessment
from app.schemas.complaint import ComplaintCreate, ComplaintFields, ComplaintRecord, ComplaintSummaryOut, RiskAssessmentOut


class ComplaintRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, payload: ComplaintCreate) -> ComplaintRecord:
        customer = self._get_or_create_customer(payload.fields.customer_name, payload.fields.complaint_source)
        fields = payload.fields
        complaint = Complaint(
            complaint_source=fields.complaint_source,
            customer=customer,
            product_name=fields.product_name,
            product_strength=fields.product_strength,
            batch_lot_number=fields.batch_lot_number,
            manufacturing_date=fields.manufacturing_date,
            expiry_date=fields.expiry_date,
            affected_quantity=fields.affected_quantity,
            facility=fields.facility,
            material=fields.material,
            complaint_category=fields.complaint_category,
            complaint_description=fields.complaint_description,
            status="Ready to Commit",
            completeness_score=payload.summary.completeness.score if payload.summary else 0,
            duplicate_score=payload.summary.duplicate_score if payload.summary else 0,
        )
        self.db.add(complaint)
        self.db.flush()
        if payload.risk:
            self.db.add(self._risk_model(complaint.id, payload.risk))
        self.db.commit()
        self.db.refresh(complaint)
        return self._to_record(complaint, payload.risk, payload.summary)

    def get(self, complaint_id: str) -> ComplaintRecord | None:
        complaint = self.db.get(Complaint, complaint_id)
        if not complaint:
            return None
        latest_risk = complaint.risk_assessments[-1] if complaint.risk_assessments else None
        risk = RiskAssessmentOut.model_validate(latest_risk.__dict__) if latest_risk else None
        summary = ComplaintSummaryOut(
            duplicate_score=complaint.duplicate_score,
            completeness={"score": complaint.completeness_score, "missing_fields": [], "ready_to_commit": True},
        )
        return self._to_record(complaint, risk, summary)

    def update(self, complaint_id: str, payload: ComplaintCreate) -> ComplaintRecord | None:
        complaint = self.db.get(Complaint, complaint_id)
        if not complaint:
            return None
        before = self._fields_from_model(complaint).model_dump()
        customer = self._get_or_create_customer(payload.fields.customer_name, payload.fields.complaint_source)
        self._apply_fields(complaint, payload.fields)
        complaint.customer = customer
        complaint.status = "Ready to Commit"
        complaint.completeness_score = payload.summary.completeness.score if payload.summary else complaint.completeness_score
        complaint.duplicate_score = payload.summary.duplicate_score if payload.summary else complaint.duplicate_score
        if payload.risk:
            self.db.add(self._risk_model(complaint.id, payload.risk))
        self.db.add(
            AuditLog(
                complaint_id=complaint.id,
                action="complaint_updated",
                before=before,
                after=payload.fields.model_dump(),
            )
        )
        self.db.commit()
        self.db.refresh(complaint)
        return self._to_record(complaint, payload.risk, payload.summary)

    def _get_or_create_customer(self, name: str, source_type: str | None) -> Customer | None:
        if not name:
            return None
        customer = self.db.scalar(select(Customer).where(Customer.name == name))
        if customer:
            return customer
        customer = Customer(name=name, source_type=source_type)
        self.db.add(customer)
        self.db.flush()
        return customer

    def _risk_model(self, complaint_id: str, risk: RiskAssessmentOut) -> RiskAssessment:
        return RiskAssessment(complaint_id=complaint_id, **risk.model_dump())

    def _apply_fields(self, complaint: Complaint, fields: ComplaintFields) -> None:
        complaint.complaint_source = fields.complaint_source
        complaint.product_name = fields.product_name
        complaint.product_strength = fields.product_strength
        complaint.batch_lot_number = fields.batch_lot_number
        complaint.manufacturing_date = fields.manufacturing_date
        complaint.expiry_date = fields.expiry_date
        complaint.affected_quantity = fields.affected_quantity
        complaint.facility = fields.facility
        complaint.material = fields.material
        complaint.complaint_category = fields.complaint_category
        complaint.complaint_description = fields.complaint_description

    def _fields_from_model(self, complaint: Complaint) -> ComplaintFields:
        return ComplaintFields(
            complaint_source=complaint.complaint_source or "",
            customer_name=complaint.customer.name if complaint.customer else "",
            product_name=complaint.product_name or "",
            product_strength=complaint.product_strength or "",
            batch_lot_number=complaint.batch_lot_number or "",
            manufacturing_date=complaint.manufacturing_date or "",
            expiry_date=complaint.expiry_date or "",
            affected_quantity=complaint.affected_quantity or "",
            facility=complaint.facility or "",
            material=complaint.material or "",
            complaint_category=complaint.complaint_category or "",
            complaint_description=complaint.complaint_description or "",
        )

    def _to_record(
        self,
        complaint: Complaint,
        risk: RiskAssessmentOut | None,
        summary: ComplaintSummaryOut | None,
    ) -> ComplaintRecord:
        return ComplaintRecord(
            id=complaint.id,
            fields=self._fields_from_model(complaint),
            risk=risk,
            summary=summary,
            status=complaint.status,
            created_at=complaint.created_at,
            updated_at=complaint.updated_at,
        )
