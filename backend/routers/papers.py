import time
import base64
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from services.vector_store import (
    get_all_papers,
    add_paper_to_store,
    get_paper_by_id,
    delete_paper_from_store,
    reset_store,
    get_store_stats,
    chunks_db
)

router = APIRouter(tags=["Papers"])

class ResetSessionRequest(BaseModel):
    mode: Optional[str] = "preset"

class PaperUploadRequest(BaseModel):
    title: str
    authors: Optional[str] = "Independent Author"
    category: Optional[str] = "Custom Upload"
    text: Optional[str] = ""
    fileBase64: Optional[str] = None

class DirectPaperCreateRequest(BaseModel):
    title: str
    authors: List[str]
    year: int
    abstract: str
    topicCategory: Optional[str] = "Custom Paper"
    fullText: Optional[str] = ""

@router.get("/api/stats")
async def get_stats():
    return get_store_stats()

@router.get("/api/papers")
async def list_papers(category: Optional[str] = None):
    all_p = get_all_papers()
    if category and category != "All":
        filtered = [p for p in all_p if p.get("topicCategory", "").lower() == category.lower()]
        return filtered
    return all_p

@router.get("/api/papers/{paper_id}")
async def get_paper_details(paper_id: str):
    paper = get_paper_by_id(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    paper_chunks = [c for c in chunks_db if c["paperId"] == paper_id]
    return {"paper": paper, "chunks": paper_chunks}

@router.delete("/api/papers/{paper_id}")
async def remove_paper(paper_id: str):
    success = delete_paper_from_store(paper_id)
    if not success:
        raise HTTPException(status_code=404, detail="Paper not found or already deleted")
    return {"message": "Paper removed from index", "paperId": paper_id}

@router.post("/api/papers/reset-session")
async def reset_session(req: ResetSessionRequest):
    reset_store()
    if req.mode == "preset":
        from main import SAMPLE_PAPERS
        for paper in SAMPLE_PAPERS:
            add_paper_to_store(paper)
        return {"message": "Research session reset to benchmark landmark papers."}
    return {"message": "Research session reset to empty vector repository."}

@router.post("/api/upload-paper")
async def upload_custom_paper(req: PaperUploadRequest):
    try:
        authors_list = [a.strip() for a in req.authors.split(",")] if req.authors else ["Independent Author"]
        content_text = req.text or ""

        if req.fileBase64 and not content_text:
            # Decode base64 if provided
            try:
                decoded_bytes = base64.b64decode(req.fileBase64.split(",")[-1])
                content_text = decoded_bytes.decode("utf-8", errors="ignore")
            except Exception as e:
                print(f"Base64 parse notice: {e}")
                content_text = f"Custom uploaded document: {req.title}"

        if not content_text:
            content_text = f"Document Title: {req.title}. Category: {req.category or 'Custom Upload'}."

        paper_id = f"custom_{int(time.time())}"
        paper_obj = {
            "id": paper_id,
            "title": req.title,
            "authors": authors_list,
            "year": 2025,
            "abstract": content_text[:350] + ("..." if len(content_text) > 350 else ""),
            "topicCategory": req.category or "Custom Upload",
            "fullText": content_text,
            "chunkCount": 0
        }

        chunks_indexed = add_paper_to_store(paper_obj)
        return {"paper": paper_obj, "chunksIndexed": chunks_indexed, "message": "Paper uploaded and indexed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/papers")
async def create_paper(req: DirectPaperCreateRequest):
    try:
        paper_id = f"custom_{int(time.time())}"
        paper_obj = {
            "id": paper_id,
            "title": req.title,
            "authors": req.authors,
            "year": req.year,
            "abstract": req.abstract,
            "topicCategory": req.topicCategory,
            "fullText": req.fullText or f"{req.title}. {req.abstract}",
            "chunkCount": 0
        }
        chunks_indexed = add_paper_to_store(paper_obj)
        return {"paper": paper_obj, "chunksIndexed": chunks_indexed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
