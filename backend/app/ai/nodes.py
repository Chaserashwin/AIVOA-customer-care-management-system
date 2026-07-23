from __future__ import annotations

from uuid import uuid4

from app.ai.clients import ComplaintLLMClient
from app.ai.heuristics import extract_correction_patch
from app.ai.state import ComplaintGraphState, Intent
from app.schemas.complaint import ComplaintFields
from app.services.risk_service import RiskService


def detect_intent(state: ComplaintGraphState) -> ComplaintGraphState:
    if state.get("forced_intent"):
        return {**state, "intent": state["forced_intent"]}

    message = state.get("message", "")
    lower = message.lower()
    has_current = any(value for value in state.get("current_complaint", {}).values())

    if state.get("uploaded_text"):
        intent: Intent = "pdf_upload"
    elif any(term in lower for term in ["why", "explain", "severity", "critical", "risk"]):
        intent = "question_answering"
    elif has_current and any(
        term in lower for term in ["sorry", "correct", "correction", "update", "change", "batch", "quantity", "expiry"]
    ):
        intent = "correction"
    else:
        intent = "new_complaint"

    return {**state, "intent": intent}


def route_by_intent(state: ComplaintGraphState) -> str:
    return state["intent"]


def complaint_extraction(state: ComplaintGraphState) -> ComplaintGraphState:
    patch = ComplaintLLMClient().extract(state.get("message", ""))
    return {**state, "extraction": patch, "updated_fields": sorted(patch.keys())}


def correction_node(state: ComplaintGraphState) -> ComplaintGraphState:
    patch = extract_correction_patch(state.get("message", ""))
    return {**state, "extraction": patch, "updated_fields": sorted(patch.keys())}


def ocr_extraction(state: ComplaintGraphState) -> ComplaintGraphState:
    text = state.get("uploaded_text") or state.get("message", "")
    source_hint = state.get("source_hint") or ("Email" if "email" in text.lower() else "PDF")
    patch = ComplaintLLMClient().extract(text, source_hint=source_hint)
    return {**state, "extraction": patch, "updated_fields": sorted(patch.keys())}


def question_answering(state: ComplaintGraphState) -> ComplaintGraphState:
    complaint = ComplaintFields.model_validate(state.get("current_complaint", {}))
    risk = RiskService().assess(complaint)
    response = (
        f"Severity is {risk.severity} because {risk.reasoning} Suggested action: "
        f"{risk.suggested_next_action}."
    )
    return {**state, "extraction": {}, "updated_fields": [], "assistant_response": response}


def structured_json_validation(state: ComplaintGraphState) -> ComplaintGraphState:
    patch = ComplaintFields.model_validate(state.get("extraction", {})).non_empty_patch()
    return {**state, "validated_patch": patch}


def complaint_merge(state: ComplaintGraphState) -> ComplaintGraphState:
    current = ComplaintFields.model_validate(state.get("current_complaint", {})).model_dump()
    patch = state.get("validated_patch", {})
    merged = {**current, **patch}
    updated_fields = [field for field in patch.keys() if current.get(field) != patch.get(field)]
    return {**state, "complaint": merged, "updated_fields": updated_fields}


def risk_assessment(state: ComplaintGraphState) -> ComplaintGraphState:
    fields = ComplaintFields.model_validate(state.get("complaint", state.get("current_complaint", {})))
    risk = RiskService().assess(fields).model_dump()
    return {**state, "risk": risk}


def summary_generator(state: ComplaintGraphState) -> ComplaintGraphState:
    fields = ComplaintFields.model_validate(state.get("complaint", state.get("current_complaint", {})))
    risk_service = RiskService()
    risk = risk_service.assess(fields)
    summary = risk_service.summary(fields, risk).model_dump()

    if state.get("assistant_response"):
        response = state["assistant_response"]
    elif state.get("intent") == "correction":
        response = _correction_response(state.get("updated_fields", []), fields)
    elif state.get("intent") == "pdf_upload":
        source_label = state.get("source_hint") or "PDF"
        response = (
            f"{source_label} analysis complete. I've successfully extracted the complaint data, mapped the batch "
            "information, and populated the form on the left."
        )
    else:
        response = (
            "Complaint parsed successfully. I've extracted the product details, mapped the batch information, "
            "and generated an initial risk assessment for this complaint."
        )

    status = "Ready to Commit" if summary["completeness"]["ready_to_commit"] else "Pending Triage"
    return {**state, "summary": summary, "assistant_response": response, "status": status}


def redux_sync(state: ComplaintGraphState) -> ComplaintGraphState:
    return {
        **state,
        "conversation_id": state.get("conversation_id") or str(uuid4()),
        "redux_sync": {
            "patch": state.get("validated_patch", {}),
            "updated_fields": state.get("updated_fields", []),
            "status": state.get("status", "Pending Triage"),
        },
    }


def _correction_response(updated_fields: list[str], fields: ComplaintFields) -> str:
    if not updated_fields:
        return "I could not find a specific field correction. Please mention the field and corrected value."
    labels = {
        "batch_lot_number": f'Batch / Lot Number to "{fields.batch_lot_number}"',
        "affected_quantity": f'Affected Quantity to "{fields.affected_quantity}"',
        "expiry_date": f'Expiry Date to "{fields.expiry_date}"',
        "manufacturing_date": f'Manufacturing Date to "{fields.manufacturing_date}"',
        "complaint_category": f'Complaint Category to "{fields.complaint_category}"',
        "customer_name": f'Customer Name to "{fields.customer_name}"',
    }
    changes = " and ".join(labels.get(field, field.replace("_", " ")) for field in updated_fields)
    return f"Got it. I have updated the {changes} in the form."
