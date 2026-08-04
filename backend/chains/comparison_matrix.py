import os
import json
from services.nemotron_llm import generate_nemotron_response

async def run_comparison_matrix(paper_count: int, papers_json: str) -> list:
    """
    Generates a structured JSON comparison matrix evaluating all papers using Nemotron LLM.
    """
    system_prompt = (
        "You are an expert AI Benchmark Analyst. "
        "Analyze the provided research papers and output ONLY a valid JSON object matching the requested schema."
    )

    prompt = f"""Analyze these {paper_count} research papers indexed in our repository and generate a structured JSON comparison matrix evaluating ALL of them.

INDEXED PAPERS:
{papers_json}

Return a valid JSON object with a "matrix" array containing objects for EACH paper in the repository with these exact keys:
- "paradigm": Short paradigm or architecture name
- "paper": Title with year (e.g., "From Local to Global: A Graph RAG Approach (2024)")
- "architecture": Technical architecture overview
- "retrievalType": Retrieval mechanism or reasoning technique
- "bestUseCase": Ideal use case scenario
- "keyAdvantage": Main performance or functional advantage
- "mainLimitation": Primary trade-off or constraint
- "indexingCost": Indexing token or compute cost (e.g. Low, Moderate, High)
- "queryLatency": Expected query response latency (e.g. "< 10ms", "~1.5s")

RETURN ONLY VALID JSON (no markdown fence):"""

    raw_response = await generate_nemotron_response(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.1,
        max_tokens=2500
    )

    try:
        # Strip potential markdown backticks
        clean_json = raw_response.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[1]
            if clean_json.endswith("```"):
                clean_json = clean_json.rsplit("```", 1)[0]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]

        parsed = json.loads(clean_json.strip())
        if isinstance(parsed, dict) and "matrix" in parsed:
            return parsed["matrix"]
        if isinstance(parsed, list):
            return parsed
    except Exception as e:
        print(f"Comparison matrix JSON parse notice: {e}")

    return []
