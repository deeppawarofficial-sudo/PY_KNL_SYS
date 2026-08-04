import os
from services.nemotron_llm import generate_nemotron_response

async def run_rag_synthesis(query: str, context_str: str) -> str:
    """
    Executes multi-paper RAG synthesis using Nvidia Nemotron LLM.
    """
    system_prompt = (
        "You are an elite AI Research Assistant and Literature Synthesizer powered by Nvidia Nemotron LLM. "
        "Synthesize an authoritative research response for the user query based on the retrieved vector evidence. "
        "Include verifiable inline citations [C1], [C2], etc. matching the context excerpts."
    )

    prompt = f"""USER RESEARCH QUERY:
{query}

RETRIEVED MULTI-PAPER VECTOR EXCERPTS:
{context_str}

REQUIREMENTS:
1. Provide a direct, structured response synthesizing findings across papers.
2. Use inline citations [C1], [C2], etc. to credit source context lines.
3. Highlight architectural tradeoffs, benchmark results, and limitations.
4. Format in clean, readable Markdown.

SYNTHESIZED RESPONSE:"""

    response = await generate_nemotron_response(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.2,
        max_tokens=2000
    )
    return response
