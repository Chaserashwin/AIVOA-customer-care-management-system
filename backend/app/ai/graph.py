from __future__ import annotations

from uuid import uuid4

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from app.ai.nodes import (
    complaint_extraction,
    complaint_merge,
    correction_node,
    detect_intent,
    ocr_extraction,
    question_answering,
    redux_sync,
    risk_assessment,
    route_by_intent,
    structured_json_validation,
    summary_generator,
)
from app.ai.state import ComplaintGraphState
from app.schemas.chat import ChatFinalResponse
from app.schemas.complaint import ComplaintFields, ComplaintSummaryOut, RiskAssessmentOut


def build_graph(checkpointer: MemorySaver | None = None):
    workflow = StateGraph(ComplaintGraphState)
    workflow.add_node("intent_detection", detect_intent)
    workflow.add_node("complaint_extraction", complaint_extraction)
    workflow.add_node("correction", correction_node)
    workflow.add_node("ocr_extraction", ocr_extraction)
    workflow.add_node("question_answering", question_answering)
    workflow.add_node("structured_json_validation", structured_json_validation)
    workflow.add_node("complaint_merge", complaint_merge)
    workflow.add_node("risk_assessment", risk_assessment)
    workflow.add_node("summary_generator", summary_generator)
    workflow.add_node("redux_sync", redux_sync)

    workflow.set_entry_point("intent_detection")
    workflow.add_conditional_edges(
        "intent_detection",
        route_by_intent,
        {
            "new_complaint": "complaint_extraction",
            "correction": "correction",
            "pdf_upload": "ocr_extraction",
            "question_answering": "question_answering",
        },
    )
    workflow.add_edge("complaint_extraction", "structured_json_validation")
    workflow.add_edge("correction", "structured_json_validation")
    workflow.add_edge("ocr_extraction", "structured_json_validation")
    workflow.add_edge("question_answering", "structured_json_validation")
    workflow.add_edge("structured_json_validation", "complaint_merge")
    workflow.add_edge("complaint_merge", "risk_assessment")
    workflow.add_edge("risk_assessment", "summary_generator")
    workflow.add_edge("summary_generator", "redux_sync")
    workflow.add_edge("redux_sync", END)
    return workflow.compile(checkpointer=checkpointer)


class ComplaintGraphRunner:
    def __init__(self) -> None:
        self._memory = MemorySaver()
        self._graph = build_graph(self._memory)

    def run(
        self,
        *,
        message: str,
        current_complaint: ComplaintFields | None = None,
        conversation_id: str | None = None,
        uploaded_text: str | None = None,
        source_hint: str | None = None,
        forced_intent: str | None = None,
    ) -> ChatFinalResponse:
        thread_id = conversation_id or str(uuid4())
        state: ComplaintGraphState = {
            "message": message,
            "conversation_id": thread_id,
            "current_complaint": (current_complaint or ComplaintFields()).model_dump(),
        }
        if uploaded_text:
            state["uploaded_text"] = uploaded_text
        if source_hint:
            state["source_hint"] = source_hint
        if forced_intent:
            state["forced_intent"] = forced_intent  # type: ignore[typeddict-item]

        result = self._graph.invoke(state, config={"configurable": {"thread_id": thread_id}})
        return ChatFinalResponse(
            conversation_id=result["conversation_id"],
            intent=result["intent"],
            assistant_response=result["assistant_response"],
            complaint=ComplaintFields.model_validate(result.get("complaint", {})),
            risk=RiskAssessmentOut.model_validate(result.get("risk", {})),
            summary=ComplaintSummaryOut.model_validate(result.get("summary", {})),
            updated_fields=result.get("updated_fields", []),
            status=result.get("status", "Pending Triage"),
            redux_sync=result.get("redux_sync", {}),
        )
