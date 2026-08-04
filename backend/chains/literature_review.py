import os
from services.nemotron_llm import generate_nemotron_response

async def run_literature_review(paper_count: int, catalog_str: str, context_str: str) -> str:
    """
    Synthesizes a comprehensive Literature Review across all indexed papers using Nvidia Nemotron LLM.
    """
    system_prompt = (
        "You are an expert AI Research Synthesizer utilizing Nvidia Nemotron LLM. "
        "Generate a unified, single-document Literature Review report analyzing ALL indexed papers."
    )

    prompt = f"""Generate a comprehensive scientific Literature Review covering ALL {paper_count} research papers currently indexed in our repository.

INDEXED PAPERS CATALOG ({paper_count} PAPERS):
{catalog_str}

RETRIEVED MULTI-PAPER VECTOR EXCERPTS:
{context_str}

CRITICAL REQUIREMENTS:
1. Cover ALL {paper_count} indexed papers in this single literature review synthesis!
2. Structure the review with clear Markdown headings:
   # Comprehensive Scientific Literature Review ({paper_count} Papers)
   ## 1. Executive Summary & Repository Scope
   ## 2. Paradigm Evolution & Methodological Taxonomies
   ## 3. Side-by-Side Comparative Analysis & Strategic Trade-Offs
   ## 4. Key Findings, Benchmarks & Paradigm Shifts
   ## 5. Open Challenges, Limitations & Future Research Directions
3. Use inline citations [C1], [C2] where applicable.

LITERATURE REVIEW:"""

    response = await generate_nemotron_response(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.25,
        max_tokens=3000
    )
    return response
