from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.complaint_repository import ComplaintRepository
from app.schemas.complaint import ComplaintCreate, ComplaintRecord


class ComplaintService:
    def __init__(self, db: Session) -> None:
        self.repository = ComplaintRepository(db)

    def create(self, payload: ComplaintCreate) -> ComplaintRecord:
        return self.repository.create(payload)

    def update(self, complaint_id: str, payload: ComplaintCreate) -> ComplaintRecord | None:
        return self.repository.update(complaint_id, payload)

    def get(self, complaint_id: str) -> ComplaintRecord | None:
        return self.repository.get(complaint_id)

