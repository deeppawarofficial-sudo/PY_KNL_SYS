from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.arxiv_service import search_arxiv_papers, search_semantic_scholar_papers
from services.vector_store import add_paper_to_store

router = APIRouter(prefix="/api", tags=["Research Papers Search"])

class PaperSearchRequest(BaseModel):
    query: str
    maxResults: Optional[int] = 25

class ArxivImportRequest(BaseModel):
    arxivId: Optional[str] = ""
    title: str
    authors: list
    year: int
    abstract: str
    topicCategory: Optional[str] = "ArXiv Research"

@router.post("/arxiv/search")
async def search_arxiv(req: PaperSearchRequest):
    try:
        results = await search_arxiv_papers(req.query, req.maxResults)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/semanticscholar/search")
async def search_semantic_scholar(req: PaperSearchRequest):
    try:
        results = await search_semantic_scholar_papers(req.query, req.maxResults)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/arxiv/import")
async def import_arxiv_paper(req: ArxivImportRequest):
    try:
        paper_obj = {
            "id": f"arxiv_{req.arxivId or 'import'}",
            "title": req.title,
            "authors": req.authors,
            "year": req.year,
            "abstract": req.abstract,
            "topicCategory": req.topicCategory,
            "arxivId": req.arxivId,
            "source": "arxiv",
            "pdfUrl": f"https://arxiv.org/pdf/{req.arxivId}.pdf" if req.arxivId else "",
            "fullText": f"Full text research manuscript: {req.title}. {req.abstract}"
        }
        chunks_count = add_paper_to_store(paper_obj)
        return {"paper": paper_obj, "chunksIndexed": chunks_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

