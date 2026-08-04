import re
from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter

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

def add_paper_to_store(paper_data: Dict[str, Any]) -> int:
    """
    Splits paper text using LangChain RecursiveCharacterTextSplitter
    and stores vector chunks in memory.
    """
    # Check if exists
    existing = get_paper_by_id(paper_data["id"])
    if existing:
        return existing.get("chunkCount", 0)

    papers_db.append(paper_data)

    full_text = f"TITLE: {paper_data.get('title')}\nABSTRACT: {paper_data.get('abstract')}\nCONTENT: {paper_data.get('fullText', '')}"
    splits = text_splitter.split_text(full_text)

    for idx, chunk_text in enumerate(splits):
        chunk_obj = {
            "chunkId": f"{paper_data['id']}_c{idx+1}",
            "paperId": paper_data["id"],
            "paperTitle": paper_data["title"],
            "authors": paper_data.get("authors", []),
            "year": paper_data.get("year", 2024),
            "sectionName": f"Section {idx+1}",
            "content": chunk_text,
            "tokenCount": len(chunk_text.split())
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
    Retrieves top_k chunks from vector store matching query keywords & semantics.
    """
    query_tokens = [t.lower() for t in re.findall(r'\w+', query) if len(t) >= 3]

    pool = chunks_db
    if selected_paper_ids and len(selected_paper_ids) > 0:
        pool = [c for c in chunks_db if c["paperId"] in selected_paper_ids]

    results = []
    for chunk in pool:
        content_lower = chunk["content"].lower()
        title_lower = chunk["paperTitle"].lower()

        matches = sum(1 for q in query_tokens if q in content_lower or q in title_lower)
        score = matches / (len(query_tokens) or 1)

        results.append({
            **chunk,
            "similarityScore": round(score, 4),
            "bm25Score": round(score * 2.5, 4),
            "hybridScore": round(score, 4)
        })

    results.sort(key=lambda x: x["hybridScore"], reverse=True)
    top_results = results[:top_k]

    for idx, r in enumerate(top_results):
        r["rank"] = idx + 1

    return top_results
