from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def new_id() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    source_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    complaints: Mapped[list["Complaint"]] = relationship(back_populates="customer")


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    complaint_source: Mapped[str | None] = mapped_column(String(80), nullable=True)
    customer_id: Mapped[str | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_strength: Mapped[str | None] = mapped_column(String(120), nullable=True)
    batch_lot_number: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    manufacturing_date: Mapped[str | None] = mapped_column(String(80), nullable=True)
    expiry_date: Mapped[str | None] = mapped_column(String(80), nullable=True)
    affected_quantity: Mapped[str | None] = mapped_column(String(120), nullable=True)
    facility: Mapped[str | None] = mapped_column(String(255), nullable=True)
    material: Mapped[str | None] = mapped_column(String(255), nullable=True)
    complaint_category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    complaint_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Pending Triage")
    completeness_score: Mapped[float] = mapped_column(Float, default=0.0)
    duplicate_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer: Mapped[Customer | None] = relationship(back_populates="complaints")
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(back_populates="complaint")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="complaint")
    attachments: Mapped[list["Attachment"]] = relationship(back_populates="complaint")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="complaint")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    complaint_id: Mapped[str | None] = mapped_column(ForeignKey("complaints.id"), nullable=True)
    thread_key: Mapped[str] = mapped_column(String(120), index=True, default=new_id)
    memory: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    complaint: Mapped[Complaint | None] = relationship(back_populates="conversations")
    messages: Mapped[list["AIMessage"]] = relationship(back_populates="conversation")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), index=True)
    role: Mapped[str] = mapped_column(String(32))
    content: Mapped[str] = mapped_column(Text)
    intent: Mapped[str | None] = mapped_column(String(80), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), index=True)
    severity: Mapped[str] = mapped_column(String(80))
    priority: Mapped[str] = mapped_column(String(80))
    initial_risk: Mapped[str] = mapped_column(Text)
    suggested_next_action: Mapped[str] = mapped_column(Text)
    confidence_score: Mapped[float] = mapped_column(Float)
    reasoning: Mapped[str] = mapped_column(Text)
    root_cause_recommendation: Mapped[str] = mapped_column(Text)
    suggested_capa: Mapped[str] = mapped_column(Text)
    suggested_investigation: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    complaint: Mapped[Complaint] = relationship(back_populates="risk_assessments")


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    complaint_id: Mapped[str | None] = mapped_column(ForeignKey("complaints.id"), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(120))
    storage_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="Processed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    complaint: Mapped[Complaint | None] = relationship(back_populates="attachments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), index=True)
    actor: Mapped[str] = mapped_column(String(120), default="ai-copilot")
    action: Mapped[str] = mapped_column(String(120))
    before: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    complaint: Mapped[Complaint] = relationship(back_populates="audit_logs")

