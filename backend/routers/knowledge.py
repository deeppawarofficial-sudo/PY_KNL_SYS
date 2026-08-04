from fastapi import APIRouter
from services.vector_store import get_all_papers

router = APIRouter(prefix="/api/knowledge-graph", tags=["Knowledge Graph"])

@router.get("")
async def get_knowledge_graph():
    all_papers = get_all_papers()

    nodes = [
        {"id": "n_rag", "label": "Retrieval-Augmented Generation", "type": "Concept", "cluster": "Retrieval"},
        {"id": "n_graphrag", "label": "GraphRAG & Leiden Communities", "type": "Architecture", "cluster": "Graph"},
        {"id": "n_cot", "label": "Chain-of-Thought Reasoning", "type": "Technique", "cluster": "Reasoning"},
        {"id": "n_vector", "label": "Vector Embeddings & HNSW", "type": "Storage", "cluster": "Retrieval"},
        {"id": "n_hybrid", "label": "Hybrid Search (BM25 + Dense)", "type": "Retrieval", "cluster": "Retrieval"},
    ]

    for p in all_papers:
        nodes.append({
            "id": f"node_{p['id']}",
            "label": p["title"],
            "type": "Paper",
            "cluster": p.get("topicCategory", "Research")
        })

    edges = [
        {"source": "n_rag", "target": "n_vector", "relation": "DEPENDS_ON", "weight": 0.9},
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
