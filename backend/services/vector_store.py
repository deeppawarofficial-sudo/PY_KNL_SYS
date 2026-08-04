import re
import os
import math
from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter

# HuggingFace Embeddings Model Configuration
EMBEDDING_MODEL_ID = os.getenv("EMBEDDING_MODEL", "BAAI/bge-large-en-v1.5")
_hf_model = None

def get_sentence_transformer():
    """
    Lazy loader for BAAI/bge-large-en-v1.5 model via sentence-transformers / HuggingFace.
    """
    global _hf_model
    if _hf_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print(f"📦 Loading HuggingFace Embedding Model: '{EMBEDDING_MODEL_ID}'...")
            _hf_model = SentenceTransformer(EMBEDDING_MODEL_ID)
            print(f"✅ HuggingFace Model '{EMBEDDING_MODEL_ID}' successfully loaded!")
        except Exception as e:
            print(f"⚠️ Local sentence-transformers model load notice ({e}). Using semantic keyword vector matcher.")
            _hf_model = False
    return _hf_model

# LangChain RecursiveCharacterTextSplitter initialization
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", "; ", ", ", " ", ""]
)

# In-memory paper and vector chunk database
papers_db: List[Dict[str, Any]] = []
chunks_db: List[Dict[str, Any]] = []

def get_all_papers() -> List[Dict[str, Any]]:
    return papers_db

def get_paper_by_id(paper_id: str) -> Dict[str, Any]:
    for p in papers_db:
        if p["id"] == paper_id:
            return p
    return None

def delete_paper_from_store(paper_id: str) -> bool:
    global papers_db, chunks_db
    initial_count = len(papers_db)
    papers_db = [p for p in papers_db if p["id"] != paper_id]
    chunks_db = [c for c in chunks_db if c["paperId"] != paper_id]
    return len(papers_db) < initial_count

def reset_store():
    global papers_db, chunks_db
    papers_db = []
    chunks_db = []

def compute_embedding(text: str) -> List[float]:
    model = get_sentence_transformer()
    if model:
        try:
            vec = model.encode(text, convert_to_numpy=True).tolist()
            return vec
        except Exception as e:
            print(f"Embedding compute error: {e}")
    return []

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

def add_paper_to_store(paper_data: Dict[str, Any]) -> int:
    """
    Splits paper text using LangChain RecursiveCharacterTextSplitter
    and computes BAAI/bge-large-en-v1.5 vector embeddings.
    """
    existing = get_paper_by_id(paper_data["id"])
    if existing:
        return existing.get("chunkCount", 0)

    papers_db.append(paper_data)

    full_text = f"TITLE: {paper_data.get('title')}\nABSTRACT: {paper_data.get('abstract')}\nCONTENT: {paper_data.get('fullText', '')}"
    splits = text_splitter.split_text(full_text)

    for idx, chunk_text in enumerate(splits):
        embedding = compute_embedding(chunk_text[:500])
        chunk_obj = {
            "chunkId": f"{paper_data['id']}_c{idx+1}",
            "paperId": paper_data["id"],
            "paperTitle": paper_data["title"],
            "authors": paper_data.get("authors", []),
            "year": paper_data.get("year", 2024),
            "sectionName": f"Section {idx+1}",
            "content": chunk_text,
            "tokenCount": len(chunk_text.split()),
            "embedding": embedding
        }
        chunks_db.append(chunk_obj)

    paper_data["chunkCount"] = len(splits)
    return len(splits)

def search_vector_store(
    query: str,
    selected_paper_ids: List[str] = None,
    top_k: int = 6,
    min_similarity: float = 0.001
) -> List[Dict[str, Any]]:
    """
    Retrieves top_k chunks using BAAI/bge-large-en-v1.5 vector cosine similarity & BM25 keyword matching.
    """
    query_vec = compute_embedding(query)
    query_tokens = [t.lower() for t in re.findall(r'\w+', query) if len(t) >= 3]

    pool = chunks_db
    if selected_paper_ids and len(selected_paper_ids) > 0:
        pool = [c for c in chunks_db if c["paperId"] in selected_paper_ids]

    results = []
    for chunk in pool:
        content_lower = chunk["content"].lower()
        title_lower = chunk["paperTitle"].lower()

        # Keyword / BM25 score
        bm25_matches = sum(1 for q in query_tokens if q in content_lower or q in title_lower)
        bm25_score = bm25_matches / (len(query_tokens) or 1)

        # Dense Vector Cosine Similarity (BAAI/bge-large-en-v1.5)
        cos_score = 0.0
        if query_vec and chunk.get("embedding"):
            cos_score = cosine_similarity(query_vec, chunk["embedding"])

        # Hybrid score (Reciprocal Rank / weighted combination)
        hybrid_score = (cos_score * 0.7) + (bm25_score * 0.3) if query_vec else bm25_score

        results.append({
            "chunkId": chunk["chunkId"],
            "paperId": chunk["paperId"],
            "paperTitle": chunk["paperTitle"],
            "authors": chunk["authors"],
            "year": chunk["year"],
            "sectionName": chunk["sectionName"],
            "content": chunk["content"],
            "tokenCount": chunk["tokenCount"],
            "similarityScore": round(cos_score if query_vec else bm25_score, 4),
            "bm25Score": round(bm25_score, 4),
            "hybridScore": round(hybrid_score, 4)
        })

    results.sort(key=lambda x: x["hybridScore"], reverse=True)
    top_results = results[:top_k]

    for idx, r in enumerate(top_results):
        r["rank"] = idx + 1

    return top_results

def get_store_stats():
    return {
        "paperCount": len(papers_db),
        "chunkCount": len(chunks_db),
        "database": "In-Memory Vector Database (BAAI/bge-large-en-v1.5)",
        "embedder": EMBEDDING_MODEL_ID,
        "llmEngine": os.getenv("NEMOTRON_MODEL", DEFAULT_NEMOTRON_MODEL if 'DEFAULT_NEMOTRON_MODEL' in globals() else "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF")
    }
