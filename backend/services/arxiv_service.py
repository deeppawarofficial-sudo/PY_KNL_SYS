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
