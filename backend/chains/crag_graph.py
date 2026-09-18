"""
crag_graph.py
-------------
Corrective RAG (CRAG) graph implementation using LangGraph and Groq Cloud LLMs.

Architecture:
1. retrieve_node: Hybrid search in Qdrant (BM25 + Cosine embeddings).
2. grade_documents_node: Fast binary relevance evaluation via Groq (openai/gpt-oss-20b).
3. decide_to_generate (conditional edge):
   - >= 1 relevant docs -> synthesize_answer_node
   - 0 relevant & retry < 2 -> rewrite_query_node -> retrieve_node
   - 0 relevant & retry >= 2 -> arxiv_fallback_search_node -> synthesize_answer_node
4. synthesize_answer_node: High-throughput academic synthesis via Groq (openai/gpt-oss-120b).
5. grade_hallucination (conditional edge):
   - Grounded -> END
   - Ungrounded & retry < 2 -> resynthesize_node -> END
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict
from dotenv import load_dotenv

load_dotenv()

from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser

from services.grok_llm import build_chat_groq
from services.vector_store import search_vector_store, add_paper_to_store
from services.arxiv_service import search_arxiv_papers

# Models configuration
SYNTHESIS_MODEL = os.getenv("GROK_MODEL", "openai/gpt-oss-120b")
FAST_GRADER_MODEL = "openai/gpt-oss-20b"
FALLBACK_GRADER_MODEL = "qwen/qwen3.8-27b"


class CragState(TypedDict):
    query: str
    current_query: str
    paper_ids: Optional[List[str]]
    documents: List[Dict[str, Any]]
    relevant_docs: List[Dict[str, Any]]
    generation: str
    citations: List[Dict[str, Any]]
    retry_count: int
    external_source_used: bool
    source_type: str
    trace: List[str]


def _get_grader_llm():
    """Instantiates the fast 20B model for sub-second grading."""
    try:
        return build_chat_groq(FAST_GRADER_MODEL, temperature=0.0, max_tokens=150)
    except Exception:
        return build_chat_groq(FALLBACK_GRADER_MODEL, temperature=0.0, max_tokens=150)


def _get_synthesis_llm():
    """Instantiates the 120B model for deep academic synthesis."""
    return build_chat_groq(SYNTHESIS_MODEL, temperature=0.2, max_tokens=2500)


# ---------------------------------------------------------------------------
# Node 1: Retrieve from Qdrant Vector Store
# ---------------------------------------------------------------------------
async def retrieve_node(state: CragState) -> Dict[str, Any]:
    query = state.get("current_query") or state["query"]
    paper_ids = state.get("paper_ids")

    chunks = search_vector_store(
        query=query,
        selected_paper_ids=paper_ids,
        top_k=8,
        min_similarity=0.01
    )
    trace_msg = f"[Retrieve] Retrieved {len(chunks)} chunks from Qdrant vector store using query: '{query}'"
    return {
        "documents": chunks,
        "trace": state.get("trace", []) + [trace_msg]
    }


# ---------------------------------------------------------------------------
# Node 2: Grade Document Relevance (Fast Batch Filter)
# ---------------------------------------------------------------------------
async def grade_documents_node(state: CragState) -> Dict[str, Any]:
    query = state["query"]
    docs = state.get("documents", [])
    if not docs:
        return {"relevant_docs": [], "trace": state.get("trace", []) + ["[Grade] No documents to grade"]}

    grader_llm = _get_grader_llm()
    parser = StrOutputParser()

    formatted_docs = []
    for idx, d in enumerate(docs):
        snippet = d.get('content', '')[:350].replace('\n', ' ')
        formatted_docs.append(f"[{idx+1}] {d.get('paperTitle', '')}: {snippet}")

    prompt = (
        f"You are an academic literature relevance evaluator.\n"
        f"USER QUERY: {query}\n\n"
        f"EXCERPTS:\n" + "\n".join(formatted_docs) + "\n\n"
        f"Which excerpts contain information, methodology, or context relevant to answering the query?\n"
        f"Respond with a JSON list of 1-based integer indices only, e.g. [1, 2] (or [] if none).\n"
        f"JSON:"
    )
    relevant = []
    try:
        chain = grader_llm | parser
        res = (await chain.ainvoke([HumanMessage(content=prompt)])).strip()
        match = re.search(r'\[[\d,\s]*\]', res)
        if match:
            indices = json.loads(match.group(0))
            for i in indices:
                if isinstance(i, int) and 1 <= i <= len(docs):
                    relevant.append(docs[i - 1])
        if not relevant:
            # Fallback: keep top chunks if hybrid/similarity score indicates relevance
            relevant = [d for d in docs if d.get("hybridScore", 0) > 0.02 or d.get("similarityScore", 0) > 0.35]
    except Exception:
        relevant = [d for d in docs if d.get("hybridScore", 0) > 0.02 or d.get("similarityScore", 0) > 0.35]

    trace_msg = f"[Grade] Evaluated {len(docs)} chunks -> {len(relevant)} verified relevant to query"
    return {
        "relevant_docs": relevant,
        "trace": state.get("trace", []) + [trace_msg]
    }


# ---------------------------------------------------------------------------
# Conditional Edge: Decide Next Step based on Relevance
# ---------------------------------------------------------------------------
def decide_to_generate(state: CragState) -> str:
    relevant = state.get("relevant_docs", [])
    retry_count = state.get("retry_count", 0)

    if len(relevant) >= 1:
        return "synthesize"
    if retry_count < 2:
        return "rewrite"
    return "arxiv_fallback"


# ---------------------------------------------------------------------------
# Node 3: Query Reformulation
# ---------------------------------------------------------------------------
async def rewrite_query_node(state: CragState) -> Dict[str, Any]:
    orig_query = state["query"]
    current_query = state.get("current_query", orig_query)
    retry_count = state.get("retry_count", 0) + 1

    llm = _get_grader_llm()
    parser = StrOutputParser()
    prompt = (
        f"You are an expert academic literature search optimizer.\n"
        f"The previous search query returned insufficient or irrelevant papers from the vector store.\n"
        f"ORIGINAL QUERY: {orig_query}\n"
        f"PREVIOUS SEARCH: {current_query}\n\n"
        f"Rewrite this into a concise, focused academic query using formal computer science, AI, and machine learning research terminology.\n"
        f"Output ONLY the single rewritten query string with no explanation or punctuation."
    )
    try:
        chain = llm | parser
        raw = await chain.ainvoke([HumanMessage(content=prompt)])
        new_query = raw.strip().replace('"', '').replace('\n', ' ')
        if len(new_query) < 4:
            new_query = f"{orig_query} architecture methodology benchmarks"
    except Exception:
        new_query = f"{orig_query} architecture methodology benchmarks"

    trace_msg = f"[Rewrite] Query rewritten to: '{new_query}' (Attempt {retry_count}/2)"
    return {
        "current_query": new_query,
        "retry_count": retry_count,
        "trace": state.get("trace", []) + [trace_msg]
    }


# ---------------------------------------------------------------------------
# Node 4: ArXiv External Fallback Search
# ---------------------------------------------------------------------------
async def arxiv_fallback_search_node(state: CragState) -> Dict[str, Any]:
    query = state.get("current_query") or state["query"]
    trace_msgs = state.get("trace", [])
    trace_msgs.append(f"[ArXiv Fallback] Local vector database lacked matches; querying live ArXiv API for: '{query}'")

    arxiv_chunks = []
    try:
        papers = await search_arxiv_papers(query, max_results=3)
        for p in papers:
            # Auto-ingest into vector store for future queries
            try:
                add_paper_to_store(p)
            except Exception:
                pass

            arxiv_chunks.append({
                "chunkId": f"{p['id']}_abstract",
                "paperId": p["id"],
                "paperTitle": p["title"],
                "authors": p.get("authors", ["ArXiv Researcher"]),
                "year": p.get("year", 2024),
                "sectionName": "ArXiv Abstract",
                "content": f"{p['title']}. {p.get('abstract', '')}",
                "similarityScore": 0.95,
                "hybridScore": 0.95
            })
        trace_msgs.append(f"[ArXiv Fallback] Retrieved and ingested {len(papers)} live research papers from arXiv")
    except Exception as e:
        trace_msgs.append(f"[ArXiv Fallback] Notice: arXiv query encountered {e}")

    # If even arXiv fails, fall back to any existing chunks rather than empty
    docs_to_use = arxiv_chunks if arxiv_chunks else state.get("documents", [])
    return {
        "relevant_docs": docs_to_use,
        "external_source_used": True,
        "source_type": "arxiv_live",
        "trace": trace_msgs
    }


# ---------------------------------------------------------------------------
# Node 5: Synthesize Answer with Inline Citations
# ---------------------------------------------------------------------------
async def synthesize_answer_node(state: CragState) -> Dict[str, Any]:
    query = state["query"]
    docs = state.get("relevant_docs", [])
    synthesis_llm = _get_synthesis_llm()
    parser = StrOutputParser()

    citations = []
    context_lines = []
    for idx, c in enumerate(docs):
        cite_id = f"C{idx+1}"
        citations.append({
            "citationId": cite_id,
            "paperId": c.get("paperId", f"paper_{idx+1}"),
            "paperTitle": c.get("paperTitle", "Research Publication"),
            "authors": c.get("authors", ["Academic Researcher"]),
            "year": c.get("year", 2024),
            "sectionName": c.get("sectionName", "Section"),
            "snippet": c.get("content", "")
        })
        context_lines.append(
            f"[{cite_id}] Paper: \"{c.get('paperTitle')}\" ({c.get('year')})\n"
            f"Section: {c.get('sectionName')}\n"
            f"Excerpt: {c.get('content')}"
        )

    context_str = "\n\n".join(context_lines)

    system_prompt = (
        "You are an elite AI Research Scientist and Literature Synthesizer powered by Groq Cloud.\n"
        "Synthesize an authoritative, mathematically rigorous research response for the user query strictly based on the retrieved context excerpts.\n"
        "Requirements:\n"
        "1. Provide a direct, structured response with Executive Summary, Methodological Breakdown, Formal Formulations where applicable, and Limitations.\n"
        "2. MUST include verifiable inline citations [C1], [C2], etc., matching the exact context excerpts.\n"
        "3. Highlight architectural tradeoffs, benchmark results, and empirical consensus.\n"
        "4. Format in clean, readable GitHub Markdown."
    )

    human_prompt = (
        f"USER RESEARCH QUERY:\n{query}\n\n"
        f"RETRIEVED VECTOR EVIDENCE:\n{context_str}\n\n"
        f"SYNTHESIZED RESPONSE:"
    )

    chain = synthesis_llm | parser
    generation = await chain.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_prompt)
    ])

    trace_msg = f"[Synthesize] Generated research response with {len(citations)} verifiable citations"
    return {
        "generation": generation.strip(),
        "citations": citations,
        "trace": state.get("trace", []) + [trace_msg]
    }


# ---------------------------------------------------------------------------
# Conditional Edge: Hallucination & Grounding Check
# ---------------------------------------------------------------------------
async def check_hallucination_edge(state: CragState) -> str:
    retry_count = state.get("retry_count", 0)
    if retry_count >= 2:
        return "end"

    generation = state.get("generation", "")
    citations = state.get("citations", [])
    if not citations or not generation:
        return "end"

    # Fast validation using 20B
    grader_llm = _get_grader_llm()
    parser = StrOutputParser()
    context_snippets = "\n".join([f"[{c['citationId']}]: {c['snippet'][:300]}" for c in citations[:5]])
    prompt = (
        f"You are a strict fact-checking academic reviewer.\n"
        f"CONTEXT EXCERPTS:\n{context_snippets}\n\n"
        f"GENERATED ANSWER (sample):\n{generation[:800]}\n\n"
        f"Are the factual statements in the answer grounded in the context excerpts?\n"
        f"Respond with JSON only: {{\"grounded\": \"yes\"}} or {{\"grounded\": \"no\"}}"
    )
    try:
        chain = grader_llm | parser
        res = await chain.ainvoke([HumanMessage(content=prompt)])
        if '"grounded": "no"' in res.lower():
            return "resynthesize"
    except Exception:
        pass

    return "end"


# ---------------------------------------------------------------------------
# Node 6: Strict Re-synthesis (Corrective Grounding)
# ---------------------------------------------------------------------------
async def resynthesize_node(state: CragState) -> Dict[str, Any]:
    query = state["query"]
    citations = state.get("citations", [])
    context_snippets = "\n\n".join([f"[{c['citationId']}] {c['paperTitle']}: {c['snippet']}" for c in citations])
    synthesis_llm = _get_synthesis_llm()
    parser = StrOutputParser()

    system_prompt = (
        "You are an elite AI Research Scientist. A previous generation was flagged for claims outside the context.\n"
        "Regenerate the response adhering STRICTLY and ONLY to facts mentioned in the provided context excerpts.\n"
        "Cite every single statement using [C1], [C2], etc."
    )
    human_prompt = f"USER QUERY: {query}\n\nCONTEXT:\n{context_snippets}\n\nSTRICT GROUNDED SYNTHESIS:"

    chain = synthesis_llm | parser
    generation = await chain.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_prompt)
    ])

    trace_msg = "[Guard] Hallucination check triggered corrective re-synthesis with strict context boundary"
    return {
        "generation": generation.strip(),
        "trace": state.get("trace", []) + [trace_msg]
    }


# ---------------------------------------------------------------------------
# Build and Compile the LangGraph State Machine
# ---------------------------------------------------------------------------
def build_crag_graph():
    workflow = StateGraph(CragState)

    # Add Nodes
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("grade_documents", grade_documents_node)
    workflow.add_node("rewrite_query", rewrite_query_node)
    workflow.add_node("arxiv_fallback", arxiv_fallback_search_node)
    workflow.add_node("synthesize", synthesize_answer_node)
    workflow.add_node("resynthesize", resynthesize_node)

    # Set Entry Point
    workflow.set_entry_point("retrieve")

    # Connect Nodes
    workflow.add_edge("retrieve", "grade_documents")

    # Conditional Branch: after grading
    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {
            "synthesize": "synthesize",
            "rewrite": "rewrite_query",
            "arxiv_fallback": "arxiv_fallback",
        }
    )

    # Loop back from rewrite to retrieve
    workflow.add_edge("rewrite_query", "retrieve")

    # Arxiv fallback joins synthesize
    workflow.add_edge("arxiv_fallback", "synthesize")

    # Conditional Branch: after synthesis, check hallucination
    workflow.add_conditional_edges(
        "synthesize",
        check_hallucination_edge,
        {
            "end": END,
            "resynthesize": "resynthesize",
        }
    )

    workflow.add_edge("resynthesize", END)

    return workflow.compile()


# Singleton compiled graph app
crag_app = build_crag_graph()


# ---------------------------------------------------------------------------
# Public Execution Function
# ---------------------------------------------------------------------------
async def run_crag_pipeline(query: str, paper_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Executes the full Corrective RAG (CRAG) graph on the given research query.
    Returns the synthesized generation, citations, and complete decision trace.
    """
    initial_state: CragState = {
        "query": query,
        "current_query": query,
        "paper_ids": paper_ids,
        "documents": [],
        "relevant_docs": [],
        "generation": "",
        "citations": [],
        "retry_count": 0,
        "external_source_used": False,
        "source_type": "vector_store",
        "trace": [f"[Start] Initialized Corrective RAG (CRAG) Graph for query: '{query}'"]
    }

    final_state = await crag_app.ainvoke(initial_state)
    return {
        "generation": final_state.get("generation", ""),
        "citations": final_state.get("citations", []),
        "trace": final_state.get("trace", []),
        "sourceType": final_state.get("source_type", "vector_store"),
        "externalSourceUsed": final_state.get("external_source_used", False)
    }
