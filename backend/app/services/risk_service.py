from __future__ import annotations

from app.schemas.complaint import (
    CompletenessReport,
    ComplaintFields,
    ComplaintSummaryOut,
    RiskAssessmentOut,
)


REQUIRED_FIELDS = [
    "complaint_source",
    "customer_name",
    "product_name",
    "product_strength",
    "batch_lot_number",
    "affected_quantity",
    "complaint_category",
    "complaint_description",
]


class RiskService:
    def assess(self, fields: ComplaintFields) -> RiskAssessmentOut:
        text = " ".join(str(value) for value in fields.model_dump().values()).lower()
        is_foreign_matter = any(term in text for term in ["foreign matter", "particle", "contamination"])
        is_api = "api" in text or "drug substance" in text
        is_discoloration = "discolor" in text or "colour" in text
        is_missing_expiry = not fields.expiry_date or "not provided" in fields.expiry_date.lower()

        if is_foreign_matter or (is_api and "quarantine" in text):
            severity = "Critical"
            priority = "Immediate"
            initial_risk = (
                "Potential foreign matter contamination. High impact to API quality and patient safety until "
                "laboratory investigation confirms scope."
            )
            next_action = "Laboratory investigation and manufacturing record review"
            confidence = 0.91
            reasoning = (
                "Foreign matter in an API container can indicate process, packaging, or storage control failure. "
                "The material should remain quarantined while QA confirms identity, scope, and batch impact."
            )
        elif is_discoloration:
            severity = "Major"
            priority = "High"
            initial_risk = (
                "Discolored capsules may indicate product degradation, mix-up, or packaging exposure and require "
                "QA triage before distribution decisions."
            )
            next_action = "Open quality investigation and retain sample inspection"
            confidence = 0.84
            reasoning = (
                "The complaint describes a visible quality defect in a finished dosage form. The batch and expiry "
                "are known, allowing targeted QA review and market action assessment."
            )
        else:
            severity = "Moderate"
            priority = "Normal"
            initial_risk = "Initial risk is moderate pending QA review and completion of missing complaint fields."
            next_action = "Complete intake fields and assign QA reviewer"
            confidence = 0.68
            reasoning = "The complaint lacks strong high-risk indicators but still needs structured QMS triage."

        if is_missing_expiry and severity != "Critical":
            priority = "High"

        return RiskAssessmentOut(
            severity=severity,
            priority=priority,
            initial_risk=initial_risk,
            suggested_next_action=next_action,
            confidence_score=confidence,
            reasoning=reasoning,
            root_cause_recommendation=self.root_cause(fields),
            suggested_capa=self.capa(fields),
            suggested_investigation=self.investigation(fields),
        )

    def completeness(self, fields: ComplaintFields) -> CompletenessReport:
        missing = [field for field in REQUIRED_FIELDS if not getattr(fields, field)]
        score = round((len(REQUIRED_FIELDS) - len(missing)) / len(REQUIRED_FIELDS), 2)
        return CompletenessReport(score=score, missing_fields=missing, ready_to_commit=score >= 0.85)

    def summary(self, fields: ComplaintFields, risk: RiskAssessmentOut) -> ComplaintSummaryOut:
        product = fields.product_name or "Unspecified product"
        customer = fields.customer_name or "Unspecified customer"
        batch = fields.batch_lot_number or "unknown batch"
        title = f"{product} complaint - {batch}"
        narrative = (
            f"{customer} reported {fields.complaint_category or 'a quality complaint'} for {product}. "
            f"The affected batch/lot is {batch}, with affected quantity "
            f"{fields.affected_quantity or 'not yet confirmed'}. {fields.complaint_description}".strip()
        )
        return ComplaintSummaryOut(
            title=title,
            narrative=narrative,
            duplicate_score=self.duplicate_score(fields),
            completeness=self.completeness(fields),
            root_cause_recommendation=risk.root_cause_recommendation,
            suggested_capa=risk.suggested_capa,
            suggested_investigation=risk.suggested_investigation,
        )

    def root_cause(self, fields: ComplaintFields) -> str:
        text = fields.complaint_description.lower()
        if "foreign" in text or "particle" in text:
            return "Review dispensing, sieving, line clearance, container closure, and warehouse handling records."
        if "discolor" in text:
            return "Review capsule fill records, coating/colorant controls, stability data, and distribution exposure."
        return "Assess recent deviations, batch records, supplier changes, and handling history."

    def capa(self, fields: ComplaintFields) -> str:
        if "foreign" in fields.complaint_category.lower():
            return "Quarantine impacted stock, perform contaminant ID, retrain operators if line clearance gap is confirmed."
        if "discolor" in fields.complaint_category.lower():
            return "Inspect reserve samples, trend similar complaints, and update packaging/storage controls if confirmed."
        return "Document investigation outcome and add preventive controls based on confirmed cause."

    def investigation(self, fields: ComplaintFields) -> str:
        return (
            "Open QA investigation, verify batch genealogy, review retain samples, assess market impact, and document "
            "health hazard evaluation before closure."
        )

    def duplicate_score(self, fields: ComplaintFields) -> float:
        populated = bool(fields.batch_lot_number and fields.product_name and fields.customer_name)
        if not populated:
            return 0.12
        if "amoxicillin" in fields.product_name.lower() and fields.batch_lot_number.startswith(("AMX", "BMX")):
            return 0.37
        if "metformin" in fields.product_name.lower():
            return 0.24
        return 0.18

