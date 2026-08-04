import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.vector_store import get_all_papers, add_paper_to_store, get_paper_by_id

router = APIRouter(prefix="/api/papers", tags=["Papers"])

class PaperCreateRequest(BaseModel):
    title: str
    authors: List[str]
    year: int
    abstract: str
    topicCategory: Optional[str] = "Custom Paper"
    fullText: Optional[str] = ""

@router.get("")
async def list_papers():
    papers = get_all_papers()
    return {"papers": papers, "count": len(papers)}

@router.post("")
async def create_paper(req: PaperCreateRequest):
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
        chunks_count = add_paper_to_store(paper_obj)
        return {"paper": paper_obj, "chunksIndexed": chunks_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
