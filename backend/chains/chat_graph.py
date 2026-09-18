"""
chat_graph.py
-------------
Stateful Multi-Turn Research Chat Graph using LangGraph and MemorySaver checkpointer.
Provides session persistence, conversational context accumulation, and grounded
citation retrieval scoped to research papers or the full repository.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional, Annotated
from typing_extensions import TypedDict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser

from services.grok_llm import build_chat_groq, get_grok_model, FALLBACK_MODELS
from services.vector_store import search_vector_store, get_all_papers

# Primary synthesis model on Groq
CHAT_MODEL = os.getenv("GROK_MODEL", "openai/gpt-oss-120b")
FALLBACK_CHAT_MODEL = "openai/gpt-oss-20b"


class ChatGraphState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    paper_id: Optional[str]
    paper_title: Optional[str]
    context: str
    citations: List[Dict[str, Any]]
    retrieved_chunks: List[Dict[str, Any]]
    thread_id: str


# ---------------------------------------------------------------------------
# Node: retrieve_context
# ---------------------------------------------------------------------------
def retrieve_chat_context_node(state: ChatGraphState) -> Dict[str, Any]:
    """
    Finds the latest user query from conversational state and retrieves
    the most relevant chunks from Qdrant vector store.
    """
    messages = state.get("messages", [])
    last_user_query = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage) or (hasattr(m, "type") and m.type == "human"):
            last_user_query = m.content
            break
        elif isinstance(m, dict) and m.get("role") == "user":
            last_user_query = m.get("content", "")
            break

    if not last_user_query and messages:
        last_user_query = messages[-1].content if hasattr(messages[-1], "content") else str(messages[-1])

    paper_id = state.get("paper_id")
    selected_paper_ids = [paper_id] if paper_id else None

    # Retrieve top 5 chunks from Qdrant vector store
    chunks = search_vector_store(
        query=last_user_query,
        selected_paper_ids=selected_paper_ids,
        top_k=5
    )

    citations = []
    context_lines = []
    for idx, c in enumerate(chunks):
        cite_id = f"C{idx+1}"
        citations.append({
            "citationId": cite_id,
            "paperId": c.get("paperId"),
            "paperTitle": c.get("paperTitle"),
            "authors": c.get("authors", []),
            "year": c.get("year", 2024),
            "sectionName": c.get("sectionName", "Excerpt"),
            "snippet": c.get("content", "")
        })
        authors_str = ", ".join(c.get("authors", [])) if isinstance(c.get("authors"), list) else str(c.get("authors", ""))
        context_lines.append(
            f"[{cite_id}] Paper: \"{c.get('paperTitle')}\" ({c.get('year', 2024)}) by {authors_str}\n"
            f"Section: {c.get('sectionName', 'Excerpt')}\n"
            f"Excerpt: {c.get('content', '')}"
        )

    context_str = "\n\n".join(context_lines) if context_lines else "No direct excerpts retrieved."

    # Look up paper title if paper_id provided
    paper_title = None
    if paper_id:
        try:
            all_papers = get_all_papers()
            target = next((p for p in all_papers if p.get("id") == paper_id), None)
            if target:
                paper_title = target.get("title")
        except Exception:
            pass

    return {
        "context": context_str,
        "citations": citations,
        "retrieved_chunks": chunks,
        "paper_title": paper_title
    }


# ---------------------------------------------------------------------------
# Node: generate_response
# ---------------------------------------------------------------------------
async def generate_chat_response_node(state: ChatGraphState) -> Dict[str, Any]:
    """
    Generates a conversational, scholarly answer grounded in the retrieved excerpts,
    maintaining full awareness of conversational history stored in LangGraph state.
    """
    context_str = state.get("context", "")
    paper_title = state.get("paper_title")
    messages = state.get("messages", [])

    system_instruction = (
        "You are an elite AI Research Assistant chatbot in the AI Knowledge Synthesizer platform, "
        "powered by LangGraph with persistent conversational memory and Groq LLMs.\n\n"
        "GUIDELINES:\n"
        "1. Ground all factual assertions, algorithms, formulas, and findings in the provided research paper excerpts.\n"
        "2. Whenever citing evidence from the excerpts, use inline bracketed citations such as [C1], [C2].\n"
        "3. You maintain full conversational memory across turns. When the user asks follow-up questions, uses pronouns, "
        "or references previous topics, resolve them smoothly using past turns in the dialogue.\n"
        "4. Provide crisp, structured explanations with markdown formatting (headings, bullet points, code blocks where helpful).\n"
        "5. Be scholarly, accurate, and direct."
    )

    if paper_title:
        system_instruction += f"\n\nCURRENT SCOPE: You are scoped specifically to the research paper: \"{paper_title}\"."
    else:
        system_instruction += "\n\nCURRENT SCOPE: Scoped across all indexed research papers in the repository."

    if context_str:
        system_instruction += f"\n\nRETRIEVED RESEARCH PAPER EVIDENCE:\n{context_str}"

    # Construct LangChain messages array for ChatGroq
    lc_messages: List[BaseMessage] = [SystemMessage(content=system_instruction)]

    for m in messages:
        if isinstance(m, (HumanMessage, AIMessage, SystemMessage)):
            lc_messages.append(m)
        elif isinstance(m, dict):
            role = m.get("role", "user")
            content = m.get("content", "")
            if role in ("assistant", "bot"):
                lc_messages.append(AIMessage(content=content))
            else:
                lc_messages.append(HumanMessage(content=content))
        elif hasattr(m, "content"):
            lc_messages.append(HumanMessage(content=str(m.content)))

    parser = StrOutputParser()
    answer = None

    models_to_try = [CHAT_MODEL, FALLBACK_CHAT_MODEL] + [m for m in FALLBACK_MODELS if m not in (CHAT_MODEL, FALLBACK_CHAT_MODEL)]

    for model_name in models_to_try:
        try:
            llm = build_chat_groq(model_name, temperature=0.3, max_tokens=2048)
            chain = llm | parser
            answer = await chain.ainvoke(lc_messages)
            if model_name != CHAT_MODEL:
                print(f"[ChatGraph] Fallback model '{model_name}' succeeded.")
            break
        except Exception as e:
            print(f"[ChatGraph] Model '{model_name}' error: {e}")
            continue

    if not answer:
        answer = "I apologize, but I encountered an issue generating the response from the LLM engine. Please try again."

    return {
        "messages": [AIMessage(content=answer)]
    }


# ---------------------------------------------------------------------------
# Graph Compilation with MemorySaver Checkpointer
# ---------------------------------------------------------------------------
def build_chat_graph(checkpointer: Optional[MemorySaver] = None):
    """
    Constructs the LangGraph stateful chat workflow.
    """
    workflow = StateGraph(ChatGraphState)

    workflow.add_node("retrieve_context", retrieve_chat_context_node)
    workflow.add_node("generate_response", generate_chat_response_node)

    workflow.add_edge(START, "retrieve_context")
    workflow.add_edge("retrieve_context", "generate_response")
    workflow.add_edge("generate_response", END)

    if checkpointer is None:
        checkpointer = MemorySaver()

    return workflow.compile(checkpointer=checkpointer)


# Global singleton MemorySaver instance & compiled graph
chat_memory_saver = MemorySaver()
chat_graph_app = build_chat_graph(checkpointer=chat_memory_saver)


# ---------------------------------------------------------------------------
# Public Chat Pipeline Execution
# ---------------------------------------------------------------------------
async def run_chat_pipeline(
    query: str,
    thread_id: str,
    paper_id: Optional[str] = None,
    messages_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Executes a multi-turn chat interaction through the LangGraph workflow using MemorySaver.
    State is persisted per `thread_id`.
    """
    config = {"configurable": {"thread_id": thread_id}}

    # Check if this thread already has saved state in MemorySaver
    existing_state = chat_graph_app.get_state(config)

    initial_messages: List[BaseMessage] = []

    # If thread is brand new and messages_history is provided, seed initial turns
    if (not existing_state or not existing_state.values) and messages_history:
        for m in messages_history[:-1]:
            role = m.get("role", "user")
            content = m.get("content", "")
            if not content.strip():
                continue
            if role in ("assistant", "bot"):
                initial_messages.append(AIMessage(content=content))
            else:
                initial_messages.append(HumanMessage(content=content))

    # Add the current turn
    initial_messages.append(HumanMessage(content=query))

    input_payload = {
        "messages": initial_messages,
        "paper_id": paper_id,
        "thread_id": thread_id
    }

    final_state = await chat_graph_app.ainvoke(input_payload, config=config)

    # Extract assistant's final response
    answer = ""
    messages = final_state.get("messages", [])
    for m in reversed(messages):
        if isinstance(m, AIMessage) or (hasattr(m, "type") and m.type == "ai"):
            answer = m.content
            break

    if not answer and messages:
        answer = messages[-1].content if hasattr(messages[-1], "content") else str(messages[-1])

    return {
        "answer": answer,
        "citations": final_state.get("citations", []),
        "retrievedChunks": final_state.get("retrieved_chunks", []),
        "paperId": paper_id,
        "paperTitle": final_state.get("paper_title") or "All Papers",
        "threadId": thread_id,
        "totalMessages": len(messages)
    }
