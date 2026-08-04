from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.vector_store import get_all_papers, search_vector_store
from services.nemotron_llm import generate_nemotron_chat

router = APIRouter(tags=["Knowledge & Chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    paperId: Optional[str] = None

@router.get("/api/knowledge-graph")
async def get_knowledge_graph():
    all_papers = get_all_papers()

    nodes = [
        {"id": "n_rag", "label": "Retrieval-Augmented Generation", "type": "Concept", "cluster": "Retrieval"},
        {"id": "n_nemotron", "label": "Nvidia Nemotron LLM Engine", "type": "Architecture", "cluster": "Reasoning"},
        {"id": "n_bge", "label": "BAAI/bge-large-en Embeddings", "type": "Embedding", "cluster": "Retrieval"},
        {"id": "n_graphrag", "label": "GraphRAG & Leiden Communities", "type": "Architecture", "cluster": "Graph"},
        {"id": "n_cot", "label": "Chain-of-Thought Reasoning", "type": "Technique", "cluster": "Reasoning"},
        {"id": "n_hybrid", "label": "Hybrid Vector Search", "type": "Retrieval", "cluster": "Retrieval"},
    ]

    for p in all_papers:
        nodes.append({
            "id": f"node_{p['id']}",
            "label": p["title"],
            "type": "Paper",
            "cluster": p.get("topicCategory", "Research")
        })

    edges = [
        {"source": "n_rag", "target": "n_bge", "relation": "EMBEDDED_BY", "weight": 0.95},
        {"source": "n_nemotron", "target": "n_rag", "relation": "POWERED_BY", "weight": 0.98},
        {"source": "n_graphrag", "target": "n_rag", "relation": "EXTENDS", "weight": 0.95},
        {"source": "n_hybrid", "target": "n_rag", "relation": "IMPROVES", "weight": 0.85},
        {"source": "n_cot", "target": "n_rag", "relation": "AUGMENTS", "weight": 0.8},
    ]

    for p in all_papers:
        edges.append({
            "source": f"node_{p['id']}",
            "target": "n_rag",
            "relation": "CITES_PARADIGM",
            "weight": 0.75
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "clusters": ["Retrieval", "Graph", "Reasoning", "Research"],
        "papersCount": len(all_papers)
    }

@router.post("/api/chat")
async def chat_assistant(req: ChatRequest):
    try:
        if not req.messages or len(req.messages) == 0:
            raise HTTPException(status_code=400, detail="Messages array cannot be empty")

        last_user_message = req.messages[-1].content
        selected_paper_ids = [req.paperId] if req.paperId else None

        chunks = search_vector_store(
            query=last_user_message,
            selected_paper_ids=selected_paper_ids,
            top_k=5
        )

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
            context_lines.append(f"[{cite_id}] Paper: \"{c['paperTitle']}\" ({c['year']})\nExcerpt: {c['content']}")

        context_str = "\n\n".join(context_lines)
        messages_history = [{"role": m.role, "content": m.content} for m in req.messages]

        answer = await generate_nemotron_chat(
            messages_history=messages_history,
            context_str=context_str
        )

        paper_title = None
        if req.paperId:
            all_papers = get_all_papers()
            p = next((paper for paper in all_papers if paper["id"] == req.paperId), None)
            if p:
                paper_title = p["title"]

        return {
            "answer": answer,
            "citations": citations,
            "retrievedChunks": chunks,
            "paperId": req.paperId,
            "paperTitle": paper_title
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nemotron Chat Error: {str(e)}")
