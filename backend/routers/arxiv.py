from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.arxiv_service import search_arxiv_papers
from services.vector_store import add_paper_to_store

router = APIRouter(prefix="/api/arxiv", tags=["ArXiv"])

class ArxivSearchRequest(BaseModel):
    query: str
    maxResults: Optional[int] = 25

class ArxivImportRequest(BaseModel):
    arxivId: str
    title: str
    authors: list
    year: int
    abstract: str
    topicCategory: Optional[str] = "ArXiv Research"

@router.post("/search")
async def search_arxiv(req: ArxivSearchRequest):
    try:
        results = await search_arxiv_papers(req.query, req.maxResults)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
async def import_arxiv_paper(req: ArxivImportRequest):
    try:
        paper_obj = {
            "id": f"arxiv_{req.arxivId}",
            "title": req.title,
            "authors": req.authors,
            "year": req.year,
            "abstract": req.abstract,
            "topicCategory": req.topicCategory,
            "arxivId": req.arxivId,
            "source": "arxiv",
            "pdfUrl": f"https://arxiv.org/pdf/{req.arxivId}.pdf",
            "fullText": f"Full text research manuscript for ArXiv ID {req.arxivId}: {req.title}. {req.abstract}"
        }
        chunks_count = add_paper_to_store(paper_obj)
        return {"paper": paper_obj, "chunksIndexed": chunks_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
