import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.vector_store import search_vector_store, get_all_papers
from chains.rag_synthesis import get_rag_synthesis_chain
from chains.literature_review import get_literature_review_chain
from chains.comparison_matrix import get_comparison_matrix_chain

router = APIRouter(prefix="/api/rag", tags=["RAG & LangChain"])

class RagSearchRequest(BaseModel):
    query: str
    paperIds: Optional[List[str]] = None
    topK: Optional[int] = 6
    minSimilarity: Optional[float] = 0.01

class RagSynthesizeRequest(BaseModel):
    query: str
    paperIds: Optional[List[str]] = None

class LitReviewRequest(BaseModel):
    topicCategory: Optional[str] = "All"

@router.post("/search")
async def rag_search(req: RagSearchRequest):
    try:
        chunks = search_vector_store(
            query=req.query,
            selected_paper_ids=req.paperIds,
            top_k=req.topK or 6,
            min_similarity=req.minSimilarity or 0.01
        )
        return {"chunks": chunks, "count": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize")
async def rag_synthesize(req: RagSynthesizeRequest):
    start_time = time.time()
    try:
        all_papers = get_all_papers()
        paper_ids = req.paperIds if (req.paperIds and len(req.paperIds) > 0) else [p["id"] for p in all_papers]

        chunks = search_vector_store(req.query, paper_ids, top_k=8)

        citations = []
        context_lines = []
        for idx, c in enumerate(chunks):
            cite_id = f"C{idx+1}"
            citations.append({
                "citationId": cite_id,
                "paperId": c["paperId"],
                "paperTitle": c["paperTitle"],
                "authors": c["authors"],
                "year": c["year"],
                "sectionName": c["sectionName"],
                "snippet": c["content"]
            })
            context_lines.append(f"[{cite_id}] Paper: \"{c['paperTitle']}\" ({c['year']})\nSection: {c['sectionName']}\nExcerpt: {c['content']}")

        context_str = "\n\n".join(context_lines)

        # Execute LangChain synthesis chain
        chain = get_rag_synthesis_chain()
        answer = await chain.ainvoke({"query": req.query, "context": context_str})

        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            "query": req.query,
            "answer": answer,
            "citations": citations,
            "retrievedChunks": chunks,
            "papersUsedCount": len(set([c["paperId"] for c in chunks])),
            "executionTimeMs": elapsed_ms
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LangChain Synthesis Error: {str(e)}")

@router.post("/generate-review")
async def generate_literature_review(req: LitReviewRequest):
    try:
        all_papers = get_all_papers()
        if len(all_papers) == 0:
            raise HTTPException(status_code=400, detail="No indexed research papers found in repository.")

        all_paper_ids = [p["id"] for p in all_papers]
        chunks = search_vector_store("literature review methodology findings limitations contributions comparison", all_paper_ids, top_k=25)

        citations = []
        context_lines = []
        for idx, c in enumerate(chunks):
            cite_id = f"C{idx+1}"
            citations.append({
                "citationId": cite_id,
                "paperId": c["paperId"],
                "paperTitle": c["paperTitle"],
                "authors": c["authors"],
                "year": c["year"],
                "sectionName": c["sectionName"],
                "snippet": c["content"]
            })
            context_lines.append(f"[{cite_id}] Paper: \"{c['paperTitle']}\" ({c['year']})\nSection: {c['sectionName']}\nExcerpt: {c['content']}")

        catalog_str = "\n\n".join([f"PAPER [P{idx+1}]: \"{p['title']}\" ({p['year']}) by {', '.join(p['authors'])}\nAbstract: {p['abstract']}" for idx, p in enumerate(all_papers)])
        context_str = "\n\n".join(context_lines)

        # Execute LangChain Literature Review chain
        chain = get_literature_review_chain()
        review_text = await chain.ainvoke({
            "paper_count": len(all_papers),
            "catalog": catalog_str,
            "context": context_str
        })

        return {
            "title": f"State-of-the-Art Multi-Paper Literature Review ({len(all_papers)} Indexed Papers)",
            "topicCategory": f"All {len(all_papers)} Indexed Papers",
            "content": review_text,
            "executiveSummary": f"Unified literature review synthesized using LangChain across all {len(all_papers)} papers in the vector repository.",
            "citations": citations,
            "papersCount": len(all_papers),
            "createdDate": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LangChain Literature Review Error: {str(e)}")

@router.get("/matrix")
async def get_comparison_matrix():
    try:
        all_papers = get_all_papers()
        if len(all_papers) == 0:
            return {"matrix": [], "papersCount": 0}

        try:
            chain = get_comparison_matrix_chain()
            papers_json = [{"id": p["id"], "title": p["title"], "authors": ", ".join(p["authors"]), "year": p["year"], "topicCategory": p.get("topicCategory"), "abstract": p["abstract"]} for p in all_papers]
            result = await chain.ainvoke({
                "paper_count": len(all_papers),
                "papers_json": str(papers_json)
            })
            if "matrix" in result and isinstance(result["matrix"], list):
                return {"matrix": result["matrix"], "papersCount": len(all_papers)}
        except Exception as e:
            print(f"Matrix LLM fallback: {e}")

        # Fallback matrix
        fallback = [{
            "paradigm": p.get("topicCategory", "Indexed Research"),
            "paper": f"{p['title']} ({p['year']})",
            "architecture": p["abstract"][:140] + "...",
            "retrievalType": "Vector Cosine & LangChain Text Splitter",
            "bestUseCase": f"Domain research in {p.get('topicCategory')}",
            "keyAdvantage": f"Indexed with {p.get('chunkCount', 5)} vector chunks",
            "mainLimitation": "Domain specific scope",
            "indexingCost": "Low",
            "queryLatency": "Fast (< 50ms)"
        } for p in all_papers]

        return {"matrix": fallback, "papersCount": len(all_papers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
