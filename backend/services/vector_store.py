import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TF"] = "0"

import re
import math
import uuid
from typing import List, Dict, Any

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except Exception:
    class RecursiveCharacterTextSplitter:
        def __init__(self, chunk_size=700, chunk_overlap=100, separators=None):
            self.chunk_size = chunk_size
            self.chunk_overlap = chunk_overlap

        def split_text(self, text: str) -> List[str]:
            chunks = []
            start = 0
            length = len(text)
            while start < length:
                end = min(start + self.chunk_size, length)
                chunks.append(text[start:end])
                if end == length:
                    break
                start += self.chunk_size - self.chunk_overlap
            return chunks

from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue, MatchAny

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
            print(f"[Embedding] Loading HuggingFace Model: '{EMBEDDING_MODEL_ID}'...")
            _hf_model = SentenceTransformer(EMBEDDING_MODEL_ID)
            print(f"[Embedding] HuggingFace Model '{EMBEDDING_MODEL_ID}' successfully loaded!")
        except Exception as e:
            print(f"[Embedding] Local sentence-transformers model load notice ({e}). Using semantic keyword vector matcher.")
            _hf_model = False
    return _hf_model

# Qdrant Client Initialization
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "paper_chunks")
QDRANT_URL = os.getenv("QDRANT_URL", "").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip()

if QDRANT_URL:
    print(f"[Qdrant] Connecting to external Qdrant Vector DB at {QDRANT_URL}...")
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY if QDRANT_API_KEY else None)
else:
    print("[Qdrant] Initializing Qdrant In-Memory Vector Database...")
    qdrant_client = QdrantClient(":memory:")

_qdrant_initialized = False

def ensure_qdrant_collection(vector_size: int = 1024):
    global _qdrant_initialized
    try:
        collections = [c.name for c in qdrant_client.get_collections().collections]
        if QDRANT_COLLECTION not in collections:
            qdrant_client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
            )
            print(f"[Qdrant] Created collection '{QDRANT_COLLECTION}' (Vector Dim: {vector_size}, Distance: COSINE)")
        _qdrant_initialized = True
    except Exception as e:
        print(f"[Qdrant] Collection creation notice: {e}")

# TextSplitter initialization
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", "; ", ", ", " ", ""]
)

# In-memory paper catalog and legacy chunk cache
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

    try:
        ensure_qdrant_collection()
        qdrant_client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=Filter(
                must=[FieldCondition(key="paperId", match=MatchValue(value=paper_id))]
            )
        )
    except Exception as e:
        print(f"[Qdrant] Point deletion notice: {e}")

    return len(papers_db) < initial_count

def reset_store():
    global papers_db, chunks_db
    papers_db = []
    chunks_db = []
    try:
        collections = [c.name for c in qdrant_client.get_collections().collections]
        if QDRANT_COLLECTION in collections:
            qdrant_client.delete_collection(QDRANT_COLLECTION)
        ensure_qdrant_collection()
    except Exception as e:
        print(f"[Qdrant] Store reset notice: {e}")

def compute_embedding(text: str) -> List[float]:
    model = get_sentence_transformer()
    if model:
        try:
            vec = model.encode(text, convert_to_numpy=True).tolist()
            return vec
        except Exception as e:
            print(f"[Embedding] Compute error: {e}")
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
    Splits paper text, computes BAAI/bge-large-en-v1.5 vector embeddings,
    and stores vectors & metadata in Qdrant Vector DB.
    """
    existing = get_paper_by_id(paper_data["id"])
    if existing:
        return existing.get("chunkCount", 0)

    papers_db.append(paper_data)

    full_text = f"TITLE: {paper_data.get('title')}\nABSTRACT: {paper_data.get('abstract')}\nCONTENT: {paper_data.get('fullText', '')}"
    splits = text_splitter.split_text(full_text)

    qdrant_points = []
    sample_vec = compute_embedding(splits[0][:500]) if len(splits) > 0 else []
    vec_dim = len(sample_vec) if sample_vec else 1024
    ensure_qdrant_collection(vector_size=vec_dim)

    for idx, chunk_text in enumerate(splits):
        embedding = compute_embedding(chunk_text[:500])
        if not embedding:
            embedding = [0.0] * vec_dim

        chunk_id_str = f"{paper_data['id']}_c{idx+1}"
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk_id_str))

        chunk_obj = {
            "chunkId": chunk_id_str,
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

        qdrant_points.append(
            PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "chunkId": chunk_id_str,
                    "paperId": paper_data["id"],
                    "paperTitle": paper_data["title"],
                    "authors": paper_data.get("authors", []),
                    "year": paper_data.get("year", 2024),
                    "sectionName": f"Section {idx+1}",
                    "content": chunk_text,
                    "tokenCount": len(chunk_text.split())
                }
            )
        )

    if qdrant_points:
        try:
            qdrant_client.upsert(
                collection_name=QDRANT_COLLECTION,
                points=qdrant_points
            )
            print(f"[Qdrant] Upserted {len(qdrant_points)} vector points into collection '{QDRANT_COLLECTION}'")
        except Exception as e:
            print(f"[Qdrant] Point upsert notice: {e}")

    paper_data["chunkCount"] = len(splits)
    return len(splits)

def search_vector_store(
    query: str,
    selected_paper_ids: List[str] = None,
    top_k: int = 6,
    min_similarity: float = 0.001
) -> List[Dict[str, Any]]:
    """
    Retrieves top_k chunks using Qdrant Vector HNSW Cosine Similarity & BM25 keyword re-ranking.
    """
    query_vec = compute_embedding(query)
    query_tokens = [t.lower() for t in re.findall(r'\w+', query) if len(t) >= 3]

    qdrant_results = []
    query_filter = None

    if selected_paper_ids and len(selected_paper_ids) > 0:
        query_filter = Filter(
            must=[FieldCondition(key="paperId", match=MatchAny(any=selected_paper_ids))]
        )

    # Perform Qdrant Vector Search
    if query_vec:
        try:
            ensure_qdrant_collection(vector_size=len(query_vec))
            search_res = qdrant_client.query_points(
                collection_name=QDRANT_COLLECTION,
                query=query_vec,
                query_filter=query_filter,
                limit=top_k * 3
            )
            qdrant_results = search_res.points
        except Exception as e:
            print(f"[Qdrant] Query error: {e}")

    # Process and re-rank with BM25 Keyword Matching
    results = []

    if qdrant_results:
        for point in qdrant_results:
            payload = point.payload or {}
            content_lower = payload.get("content", "").lower()
            title_lower = payload.get("paperTitle", "").lower()

            bm25_matches = sum(1 for q in query_tokens if q in content_lower or q in title_lower)
            bm25_score = bm25_matches / (len(query_tokens) or 1)
            cos_score = float(point.score) if point.score is not None else 0.0

            hybrid_score = (cos_score * 0.7) + (bm25_score * 0.3)

            results.append({
                "chunkId": payload.get("chunkId"),
                "paperId": payload.get("paperId"),
                "paperTitle": payload.get("paperTitle"),
                "authors": payload.get("authors", []),
                "year": payload.get("year", 2024),
                "sectionName": payload.get("sectionName"),
                "content": payload.get("content"),
                "tokenCount": payload.get("tokenCount", 0),
                "similarityScore": round(cos_score, 4),
                "bm25Score": round(bm25_score, 4),
                "hybridScore": round(hybrid_score, 4)
            })
    else:
        # Fallback to in-memory chunks_db if Qdrant query returns empty or local offline mode
        pool = chunks_db
        if selected_paper_ids and len(selected_paper_ids) > 0:
            pool = [c for c in chunks_db if c["paperId"] in selected_paper_ids]

        for chunk in pool:
            content_lower = chunk["content"].lower()
            title_lower = chunk["paperTitle"].lower()

            bm25_matches = sum(1 for q in query_tokens if q in content_lower or q in title_lower)
            bm25_score = bm25_matches / (len(query_tokens) or 1)
            cos_score = 0.0
            if query_vec and chunk.get("embedding"):
                cos_score = cosine_similarity(query_vec, chunk["embedding"])

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
    qdrant_count = 0
    try:
        ensure_qdrant_collection()
        info = qdrant_client.get_collection(QDRANT_COLLECTION)
        qdrant_count = info.points_count
    except Exception:
        qdrant_count = len(chunks_db)

    return {
        "paperCount": len(papers_db),
        "chunkCount": qdrant_count,
        "database": f"Qdrant Vector DB ({'Remote' if QDRANT_URL else 'In-Memory Collection'})",
        "collection": QDRANT_COLLECTION,
        "embedder": EMBEDDING_MODEL_ID,
        "llmEngine": os.getenv("NEMOTRON_MODEL", "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF")
    }
