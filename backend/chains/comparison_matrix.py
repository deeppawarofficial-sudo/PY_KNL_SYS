"""
comparison_matrix.py
--------------------
Comparison Matrix chain using LangChain Expression Language (LCEL).

Chain structure:
    prompt_template | nemotron_llm | JsonOutputParser() [with str fallback]

The output parser attempts to decode the LLM response as JSON directly.
If parsing fails we fall back to the same manual strip-and-parse logic
that was in the original file.
"""

import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from services.nemotron_langchain import NemotronLangChain

# ---------------------------------------------------------------------------
# 1. Prompt template
#    {paper_count} and {papers_json} are filled at invoke time.
# ---------------------------------------------------------------------------
_SYSTEM = (
    "You are an expert AI Benchmark Analyst. "
    "Analyze the provided research papers and output ONLY a valid JSON object matching the requested schema."
)

_HUMAN = """\
Analyze these {paper_count} research papers indexed in our repository and generate a structured JSON comparison matrix evaluating ALL of them.

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

comparison_matrix_prompt = ChatPromptTemplate.from_messages([
    ("system", _SYSTEM),
    ("human", _HUMAN),
])

# ---------------------------------------------------------------------------
# 2. LLM — low temperature for deterministic JSON output
# ---------------------------------------------------------------------------
comparison_matrix_llm = NemotronLangChain(temperature=0.1, max_tokens=2500)

# ---------------------------------------------------------------------------
# 3. Output parser — we get back a raw string and parse JSON ourselves
#    so we can preserve the same robust fallback logic as the original file.
# ---------------------------------------------------------------------------
_str_parser = StrOutputParser()

# ---------------------------------------------------------------------------
# 4. LCEL chain — prompt | llm | parser
# ---------------------------------------------------------------------------
comparison_matrix_chain = comparison_matrix_prompt | comparison_matrix_llm | _str_parser


def _parse_matrix_json(raw_response: str) -> list:
    """
    Robustly parse the LLM's JSON response into a list of matrix rows.
    Preserves the same strip-and-parse logic as the original file.
    """
    clean_json = raw_response.strip()

    # Strip markdown code fences if present
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

    return []


# ---------------------------------------------------------------------------
# Public API — same signature as before so the router needs no changes.
# ---------------------------------------------------------------------------
async def run_comparison_matrix(paper_count: int, papers_json: str) -> list:
    """
    Generates a structured JSON comparison matrix using the LCEL chain.

    Equivalent to the old manual call but now uses the | pipe operator:
        comparison_matrix_chain = prompt | llm | parser
    """
    raw_response = await comparison_matrix_chain.ainvoke({
        "paper_count": paper_count,
        "papers_json": papers_json,
    })

    try:
        return _parse_matrix_json(raw_response)
    except Exception as e:
        print(f"Comparison matrix JSON parse notice: {e}")
        return []
