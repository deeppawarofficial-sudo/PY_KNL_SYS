import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from routers import arxiv, rag, papers, knowledge
from services.vector_store import add_paper_to_store

app = FastAPI(
    title="ArXiv & RAG Multi-Paper Research Platform (FastAPI + LangChain)",
    description="Python FastAPI backend powering multi-paper vector search, LangChain LCEL synthesis, literature review generation, and ArXiv live paper import.",
    version="2.0.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(arxiv.router)
app.include_router(rag.router)
app.include_router(papers.router)
app.include_router(knowledge.router)

# Pre-seed sample papers into vector store
SAMPLE_PAPERS = [
    {
        "id": "paper_1",
        "title": "From Local to Global: A Graph RAG Approach to Query-Focused Summarization",
        "authors": ["Darren Edge", "Ha Trinh", "Newman Cheng", "Joshua Bradley", "Alex Chao"],
        "year": 2024,
        "abstract": "Query-focused summarization over large text corpora presents significant challenges for traditional RAG. We introduce GraphRAG, combining entity-relation graph extraction with hierarchical community detection (Leiden algorithm). GraphRAG generates community summaries at multiple levels of granularity, enabling comprehensive global synthesis.",
        "topicCategory": "RAG & Retrieval Systems",
        "arxivId": "2404.16130",
        "source": "arxiv",
        "fullText": "GraphRAG addresses global sensemaking tasks by extracting an entity-relationship knowledge graph from source documents using LLMs..."
    },
    {
        "id": "paper_2",
        "title": "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning",
        "authors": ["DeepSeek-AI", "Daya Guo", "Dejian Yang", "Haowei Zhang"],
        "year": 2025,
        "abstract": "We present DeepSeek-R1-Zero and DeepSeek-R1, reasoning models trained via large-scale reinforcement learning without supervised fine-tuning as a preliminary step. DeepSeek-R1 demonstrates emergent self-verification, reflective chain-of-thought, and long reasoning behaviors.",
        "topicCategory": "Reasoning & CoT",
        "arxivId": "2501.12948",
        "source": "arxiv",
        "fullText": "DeepSeek-R1 introduces Group Relative Policy Optimization (GRPO) to incentivize mathematical and logical reasoning..."
    },
    {
        "id": "paper_3",
        "title": "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        "authors": ["Patrick Lewis", "Ethan Perez", "Aleksandara Piktus", "Fabio Petroni"],
        "year": 2020,
        "abstract": "We build RAG models where the parametric memory is a pre-trained seq2seq model and non-parametric memory is a dense vector index of Wikipedia accessed via a neural retriever (DPR).",
        "topicCategory": "RAG & Retrieval Systems",
        "arxivId": "2005.11401",
        "source": "arxiv",
        "fullText": "Retrieval-Augmented Generation combines dense passage retrieval with generative sequence models..."
    }
]

@app.on_event("startup")
async def startup_event():
    print("="*65)
    print("🚀 FastAPI + LangChain Research Platform Backend Starting...")
    print("📚 Pre-seeding initial papers into LangChain vector store...")
    for paper in SAMPLE_PAPERS:
        chunks = add_paper_to_store(paper)
        print(f"   Indexed: '{paper['title'][:45]}...' ({chunks} chunks)")
    print("✅ FastApi + LangChain Backend Ready on http://localhost:8000")
    print("="*65)

@app.get("/")
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "framework": "FastAPI",
        "aiEngine": "LangChain + Gemini",
        "message": "FastAPI Python backend is operational."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
