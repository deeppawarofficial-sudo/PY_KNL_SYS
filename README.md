# AI Multi-Paper Knowledge Synthesizer 📚⚡

A full-stack, production-grade research paper knowledge synthesis engine powered by **Python (FastAPI + Hugging Face)**, **Node.js Express**, **Nvidia Nemotron LLM / Local Qwen 2.5**, **BAAI/bge-large-en-v1.5 1024-dim Vector Embeddings**, **Qdrant Vector Database**, and a **React 19 (TypeScript + Vite + Tailwind CSS v4)** frontend.

The platform allows researchers and developers to query across multiple indexed AI manuscripts, execute dense vector retrieval using **BAAI/bge-large-en-v1.5** embeddings and cosine similarity search, generate multi-paper synthesis reports with verifiable inline citations `[C1]`, `[C2]`, produce publication-ready literature reviews, interact with an AI research paper chatbot, and explore comparative methodological matrices & dynamic knowledge graph networks.

---

## 🖼️ Application Showcase & Architecture Diagram

### System Data Flow Architecture
![System Data Flow Architecture](assets/project_architecture_flow.png)

### 1. Multi-Paper RAG Synthesis Workspace
![Synthesizer Workspace](assets/synthesizer_workspace.png)

### 2. Nvidia Nemotron AI Research Chatbot
![Research Chatbot](assets/research_chatbot.png)

### 3. Dynamic Knowledge Graph Network
![Knowledge Graph Network](assets/knowledge_graph.png)

> 📄 **Technical PDF Specification**: Download the complete system specification and data flow PDF:  
> [AI_Knowledge_Synthesizer_System_Architecture_and_Flow.pdf](file:///d:/projects%202026/RAG/ai-knowledge-synthesizer%20%281%29/AI_Knowledge_Synthesizer_System_Architecture_and_Flow.pdf)

---

## 🔄 End-to-End System Data Flow Pipeline

1. **Input & Ingestion Layer**:
   - **ArXiv Live Importer**: Fetches metadata, abstracts, and direct PDF download links from official ArXiv XML API (`https://export.arxiv.org/api/query`).
   - **Custom PDF/Text Upload**: Parses raw buffer text from user-uploaded PDFs using `pdf-parse` (Node) / `pypdf` (Python).

2. **Text Parsing & Recursive Chunking**:
   - **Recursive Character Splitter**: Splits manuscript text hierarchically using `["\n\n", "\n", ". ", " "]`.
   - **Chunk Size**: 700 characters | **Chunk Overlap**: 100 characters.
   - **Metadata Tagging**: Each chunk is attached to a payload containing `paperId`, `paperTitle`, `authors`, `year`, `sectionName`, `chunkIndex`, `pageNumber`.

3. **BAAI/bge-large-en-v1.5 Embeddings & Qdrant Storage**:
   - **Dense Embeddings**: Generates **1024-dimensional dense float vector embeddings** using Hugging Face model `BAAI/bge-large-en-v1.5`.
   - **Qdrant Vector Database**: Stores vector points inside Qdrant HNSW Graph Index (`Distance.COSINE`).

4. **Hybrid Sparse-Dense Retrieval Engine (Cosine + BM25)**:
   - Combines 1024-dim dense vector cosine similarity with BM25 keyword matching:
     $$\text{Hybrid Retrieval Score} = 0.65 \times \text{CosineSimilarity}(\vec{q}, \vec{d}) + 0.35 \times \text{BM25Score}(q, d)$$
   - Maps top-K chunks into evidence blocks tagged with verifiable inline citations `[C1]`, `[C2]`, `[C3]`.

5. **LLM Inference & Reasoning Chains**:
   - **Cloud API Mode**: Invokes Nvidia Nemotron 70B (`nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` / `meta-llama/Llama-3.3-70B-Instruct`) via Hugging Face Router API.
   - **Local Mode**: Runs `qwen2.5:3b` locally via [Ollama](https://ollama.com) (optimized for AMD Ryzen 5 3500U / 12GB RAM).
   - **Offline Fallback Engine**: Built-in 0ms local RAG reasoning engine grounded in exact paper paragraphs.

6. **React 19 Frontend UI Output**:
   - Renders Markdown synthesis with clickable inline citations `[C1]` that trigger the **Citation Modal**.
   - Displays dynamic SVG Knowledge Graph networks mapped to active session papers.
   - Exporter generates formatted PDF reports client-side using `jsPDF`.

---

## 🏛️ Project Directory Structure

```
├── assets/                         # System architecture diagram & UI screenshots
│   ├── project_architecture_flow.png
│   ├── synthesizer_workspace.png
│   ├── research_chatbot.png
│   └── knowledge_graph.png
│
├── backend/                        # Python FastAPI Backend Engine
│   ├── chains/                     # Synthesis & Reasoning Chains
│   │   ├── rag_synthesis.py        # Multi-paper RAG synthesis via Nemotron
│   │   ├── literature_review.py    # Automated literature review chain
│   │   └── comparison_matrix.py    # Dynamic JSON matrix generation chain
│   ├── routers/                    # FastAPI APIRouter Endpoints
│   │   ├── arxiv.py                # ArXiv search & live paper import (/api/arxiv/*)
│   │   ├── rag.py                  # RAG search, synthesis, review & matrix (/api/rag/*)
│   │   ├── papers.py               # Paper collection management & PDF upload (/api/papers/*)
│   │   └── knowledge.py            # Multi-turn chatbot & Knowledge Graph (/api/chat)
│   ├── services/                   # Backend Logic Services
│   │   ├── nemotron_llm.py         # Nvidia Nemotron LLM inference service (Hugging Face API)
│   │   ├── vector_store.py         # BAAI/bge-large-en-v1.5 vector store & Qdrant HNSW
│   │   └── arxiv_service.py        # Live ArXiv XML API fetcher & parser
│   ├── main.py                     # FastAPI entrypoint (Port 8000)
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment template
│
├── src/                            # React 19 Frontend & Express Server
│   ├── components/                 # UI React Components
│   │   ├── SynthesisWorkspace.tsx       # Query input & preset prompt bar
│   │   ├── SynthesizedResponseView.tsx  # RAG report renderer with inline citations
│   │   ├── ResearchChatbot.tsx          # Multi-turn paper Q&A assistant
│   │   ├── PaperLibrary.tsx             # Paper collection & raw vector chunk inspector
│   │   ├── NewSessionModal.tsx          # Session reset / benchmark paper loader
│   │   ├── ArXivImporterModal.tsx       # Live ArXiv paper search & importer modal
│   │   ├── PdfUploadModal.tsx           # Custom PDF / text file uploader
│   │   ├── LiteratureReviewView.tsx     # Automated literature review generator
│   │   ├── ComparisonMatrixView.tsx     # Methodological matrix comparison grid
│   │   └── KnowledgeGraphView.tsx       # Dynamic SVG network graph canvas
│   ├── server/                     # Express Node.js Server Architecture
│   │   ├── controllers/            # Controller logic (chat, rag, arxiv, graph)
│   │   ├── models/                 # BAAI/bge-large-en-v1.5 vector store & paper database
│   │   ├── routes/                 # Express MVC routes (/api/*)
│   │   └── services/               # Nemotron & Hugging Face LLM service
│   ├── services/                   # Frontend API Client (safeFetch wrapper)
│   │   └── api.ts
│   ├── App.tsx                     # Main layout, tab navigation, & state orchestration
│   ├── main.tsx                    # React application entrypoint
│   └── index.css                   # Tailwind CSS v4 setup & global styles
│
├── .env.example                    # Root environment configuration template
├── AI_Knowledge_Synthesizer_System_Architecture_and_Flow.pdf # PDF Specification
├── package.json                    # Node dependencies & dev scripts
├── server.ts                       # Express + Vite server entrypoint (Port 3000)
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite 6 configuration
```

---

## 🛠️ Tech Stack & Frameworks

### Backend Engine (Express + Python FastAPI)
- **Node.js & Express**: High-speed REST API server hosting Express MVC controllers and Vite dev middleware.
- **Python 3.10+ & FastAPI**: Asynchronous API server with OpenAPI / Swagger documentation.
- **Nvidia Nemotron LLM**: `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` / `meta-llama/Llama-3.3-70B-Instruct` for reasoning, synthesis, and Q&A.
- **BAAI/bge-large-en-v1.5**: 1024-dimensional dense vector embedding model via Hugging Face.
- **Qdrant Vector Database**: HNSW graph vector collection with Cosine Distance.
- **Hugging Face Hub API**: `huggingface-hub` & `sentence-transformers` for embeddings & cloud model inference.

### Frontend Application
- **React 19 & TypeScript**
- **Vite 6**: High-speed frontend tooling & bundling.
- **Tailwind CSS v4**: Modern utility-first UI styling.
- **Lucide React & Framer Motion**: UI icon system and fluid micro-animations.
- **jsPDF**: Client-side formatted PDF report generation.

---

## 🔑 Environment Variables Configuration

Copy `.env.example` to `.env` in the root directory:

```env
# Hugging Face Access Token: Required for Nvidia Nemotron LLM & BAAI/bge-large-en-v1.5 embeddings
HF_TOKEN=your_hf_token_here
HUGGINGFACEHUB_API_TOKEN=your_hf_token_here

# LLM & Embedding Models
NEMOTRON_MODEL=nvidia/Llama-3.1-Nemotron-70B-Instruct-HF
EMBEDDING_MODEL=BAAI/bge-large-en-v1.5

# Web Server & Client Ports
VITE_API_BASE_URL=
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Optional External Qdrant Vector DB
QDRANT_URL=
QDRANT_API_KEY=
```

---

## 💻 Local Model Engine Option (Ollama for 12GB RAM Laptops)

If you are approaching Hugging Face API rate limits, you can run LLMs 100% locally and offline using **[Ollama](https://ollama.com)**.

### Best Local Model: **`qwen2.5:3b`**
- **RAM Footprint**: ~1.9 GB RAM
- **Execution Speed**: ~20 tokens/sec on AMD Ryzen 5 3500U CPU
- **Run Command**:
  ```bash
  ollama run qwen2.5:3b
  ```

---

## 🚀 Quick Start Guide

### Step 1: Clone Repository & Install Node Dependencies

```bash
git clone https://github.com/deeppawarofficial-sudo/PY_KNL_SYS.git
cd PY_KNL_SYS
npm install
```

### Step 2: Configure Environment File

```bash
cp .env.example .env
```
*(Add your Hugging Face Token to `HF_TOKEN` in `.env`)*

### Step 3: Launch Express + Vite Application

```bash
npm run dev
```
- Open browser at **`http://localhost:3000`**

### Step 4: (Optional) Launch Python FastAPI Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
- FastAPI Backend Docs: **`http://localhost:8000/docs`**

---

## 📄 License

MIT License. Built for AI research exploration, multi-paper RAG synthesis, and knowledge extraction.
