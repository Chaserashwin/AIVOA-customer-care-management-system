from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.ai.graph import ComplaintGraphRunner
from app.schemas.chat import UploadResponse
from app.schemas.complaint import ComplaintFields
from app.services.document_service import DocumentService

router = APIRouter()
runner = ComplaintGraphRunner()


@router.post("/upload", response_model=UploadResponse)
async def upload_complaint(
    file: UploadFile = File(...),
    conversation_id: str | None = None,
) -> UploadResponse:
    document = await DocumentService().extract(file)
    result = runner.run(
        message=f"Uploaded {document.file_name}",
        current_complaint=ComplaintFields(),
        conversation_id=conversation_id,
        uploaded_text=document.extracted_text,
        source_hint=_source_hint(document.file_type),
        forced_intent="pdf_upload",
    )
    return UploadResponse(
        file_name=document.file_name,
        file_type=document.file_type,
        extracted_text_preview=document.extracted_text[:500],
        result=result,
    )


def _source_hint(file_type: str) -> str:
    if file_type == "eml":
        return "Email"
    if file_type == "pdf":
        return "PDF"
    return "Document"
