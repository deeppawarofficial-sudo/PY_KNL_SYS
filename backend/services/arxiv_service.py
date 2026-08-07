import httpx
import xmltodict
from typing import List, Dict, Any

async def search_arxiv_papers(query: str, max_results: int = 25) -> List[Dict[str, Any]]:
    """
    Queries live ArXiv API for research papers.
    Supports fetching larger paper lists (10 to 100 results).
    """
    limit = min(max(max_results, 1), 100)
    clean_query = httpx.URL(f"https://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results={limit}&sortBy=relevance&sortOrder=descending")

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(str(clean_query))
        if resp.status_code != 200:
            raise Exception(f"ArXiv API error HTTP {resp.status_code}")

        parsed = xmltodict.parse(resp.text)
        feed = parsed.get("feed", {})
        entries = feed.get("entry", [])

        if isinstance(entries, dict):
            entries = [entries]

        results = []
        for entry in entries:
            arxiv_id = entry.get("id", "").split("/abs/")[-1]
            title = entry.get("title", "").replace("\n", " ").strip()
            summary = entry.get("summary", "").replace("\n", " ").strip()
            published = entry.get("published", "")[:4]

            authors_raw = entry.get("author", [])
            if isinstance(authors_raw, dict):
                authors = [authors_raw.get("name", "Unknown")]
            elif isinstance(authors_raw, list):
                authors = [a.get("name", "Unknown") for a in authors_raw]
            else:
                authors = ["Unknown"]

            results.append({
                "id": f"arxiv_{arxiv_id}",
                "title": title,
                "authors": authors,
                "year": int(published) if published.isdigit() else 2024,
                "abstract": summary,
                "topicCategory": "ArXiv Research",
                "arxivId": arxiv_id,
                "pdfUrl": f"https://arxiv.org/pdf/{arxiv_id}.pdf"
            })

        return results

async def search_semantic_scholar_papers(query: str, max_results: int = 25) -> List[Dict[str, Any]]:
    """
    Queries Semantic Scholar Graph API for academic papers.
    Uses AI neural search across CS/AI research corpora with graceful fallbacks.
    """
    limit = min(max(max_results, 1), 50)
    primary_url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit={limit}&fields=title,authors,abstract,year,externalIds,openAccessPdf"
    fallback_url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit={limit}&fields=title,authors,abstract,year"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(primary_url, headers={"User-Agent": "AI-Knowledge-Synthesizer/1.0"})
        if resp.status_code == 429 or resp.status_code != 200:
            resp = await client.get(fallback_url, headers={"User-Agent": "AI-Knowledge-Synthesizer/1.0"})

        if resp.status_code == 200:
            data = resp.json()
            papers = data.get("data", [])
            results = []

            for p in papers:
                arxiv_id = (p.get("externalIds", {}) or {}).get("ArXiv", "")
                authors = [a.get("name", "Unknown") for a in p.get("authors", [])]
                pdf_info = p.get("openAccessPdf", {}) or {}
                pdf_url = pdf_info.get("url", "") or (f"https://arxiv.org/pdf/{arxiv_id}.pdf" if arxiv_id else "")

                results.append({
                    "id": f"ss_{p.get('paperId')}",
                    "paperId": p.get("paperId"),
                    "title": p.get("title", "Untitled Paper"),
                    "authors": authors if authors else ["Unknown Authors"],
                    "year": p.get("year") or 2024,
                    "abstract": p.get("abstract", "No abstract available for this paper."),
                    "publishedDate": p.get("publicationDate", str(p.get("year", 2024))),
                    "arxivId": arxiv_id,
                    "pdfUrl": pdf_url,
                    "citationCount": p.get("citationCount", 0),
                    "topicCategory": "Semantic Scholar AI Research",
                    "source": "semantic_scholar"
                })

            if results:
                return results

    # Fallback to ArXiv search if Semantic Scholar is unavailable
    return await search_arxiv_papers(query, max_results)


