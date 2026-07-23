from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.ai.graph import ComplaintGraphRunner
from app.schemas.chat import ChatRequest

router = APIRouter()
runner = ComplaintGraphRunner()


@router.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    result = runner.run(
        message=request.message,
        current_complaint=request.complaint,
        conversation_id=request.conversation_id,
    )

    async def events():
        for step in _steps_for_intent(result.intent):
            yield _event("status", {"step": step, "message": step.replace("_", " ").title()})
            await asyncio.sleep(0.08)
        yield _event("typing", {"active": True})
        for token in result.assistant_response.split(" "):
            yield _event("token", {"content": token + " "})
            await asyncio.sleep(0.015)
        yield _event("typing", {"active": False})
        yield _event("final", result.model_dump(mode="json"))

    return StreamingResponse(events(), media_type="application/x-ndjson")


def _steps_for_intent(intent: str) -> list[str]:
    branches = {
        "new_complaint": ["intent_detection", "complaint_extraction", "structured_json_validation"],
        "correction": ["intent_detection", "complaint_merge", "field_highlight"],
        "pdf_upload": ["intent_detection", "ocr_extraction", "risk_assessment"],
        "question_answering": ["intent_detection", "risk_reasoning", "summary_generator"],
    }
    return branches.get(intent, ["intent_detection"])


def _event(event_type: str, payload: dict) -> str:
    return json.dumps({"type": event_type, **payload}) + "\n"

