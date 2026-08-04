# AI Multi-Paper Knowledge Synthesizer 📚⚡

A full-stack, state-of-the-art research paper knowledge synthesis engine powered by **Python (FastAPI + LangChain LCEL)**, **Google Gemini 3.6 Flash**, and a **React 19 (TypeScript + Vite + Tailwind CSS)** frontend.

The platform allows researchers and developers to query across multiple indexed AI papers, execute vector retrieval using LangChain text chunking and similarity search, generate synthesis reports with verifiable inline citations `[C1]`, `[C2]`, generate publication-ready literature reviews, interact with an AI research paper chatbot, and explore comparative methodological matrices & knowledge graph networks.

---

## 🏛️ Architecture & Project Structure

The project uses a decoupled architecture with a **Python FastAPI + LangChain** backend engine and a modern **React 19 + TypeScript** frontend:

```
├── backend/                        # Python FastAPI & LangChain LCEL Backend
│   ├── chains/                     # LangChain LCEL Synthesis Chains
│   │   ├── rag_synthesis.py        # Multi-paper RAG synthesis chain with inline citations
│   │   ├── literature_review.py    # Automated literature review synthesis chain
│   │   └── comparison_matrix.py    # Dynamic JSON comparative matrix generation chain
│   ├── routers/                    # FastAPI APIRouter Endpoints
│   │   ├── arxiv.py                # ArXiv search & live paper import (/api/arxiv/*)
│   │   ├── rag.py                  # RAG search, synthesis, review & matrix (/api/rag/*)
│   │   ├── papers.py               # Paper collection management & PDF upload (/api/papers/*)
│   │   └── knowledge.py            # Multi-turn chatbot & Knowledge Graph (/api/chat, /api/knowledge-graph)
│   ├── services/                   # Backend Logic Services
│   │   ├── vector_store.py         # Vector store management & LangChain text chunking
│   │   └── arxiv_service.py        # Live ArXiv XML API fetcher & parser
│   ├── main.py                     # FastAPI application entrypoint & sample paper pre-seeding
│   ├── requirements.txt            # Python dependencies (FastAPI, LangChain, Uvicorn, etc.)
│   ├── run.sh                      # One-click bash script to launch backend server
│   └── .env.example                # Backend environment template
│
├── src/                            # React 19 Frontend Application
│   ├── components/                 # React UI Components
│   │   ├── SynthesisWorkspace.tsx       # Query input, scope selection, preset prompts
│   │   ├── SynthesizedResponseView.tsx  # Synthesis report renderer with inline citations & PDF export
│   │   ├── ResearchChatbot.tsx          # Multi-turn paper Q&A assistant
│   │   ├── PaperLibrary.tsx             # Paper collection & raw vector chunk inspector
│   │   ├── NewSessionModal.tsx          # Session reset / benchmark paper loader
│   │   ├── ArXivImporterModal.tsx       # Live ArXiv paper search & importer modal
│   │   ├── PdfUploadModal.tsx           # Custom PDF / text file uploader
│   │   ├── LiteratureReviewView.tsx     # Automated literature review generator
│   │   ├── ComparisonMatrixView.tsx     # Methodological matrix comparison grid
│   │   ├── KnowledgeGraphView.tsx       # Interactive network graph canvas
│   │   └── CitationModal.tsx            # Verifiable citation text chunk modal
│   ├── data/                       # Initial Benchmark Landmark Papers
│   │   └── presetPapers.ts         # Sample research papers metadata
│   ├── services/                   # Frontend API Client
│   │   └── api.ts                  # REST API fetch calls to FastAPI endpoints
│   ├── types.ts                    # TypeScript interface definitions
│   ├── App.tsx                     # Main layout, tab navigation, & state orchestration
│   ├── main.tsx                    # React application entrypoint
│   └── index.css                   # Tailwind CSS setup & global styles
│
├── .env.example                    # Frontend / root environment template
├── index.html                      # HTML entrypoint
├── package.json                    # Frontend dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite configuration & plugins
```

---

## 🛠️ Tech Stack & Frameworks

### Backend
- **Python 3.10+**
- **FastAPI**: Asynchronous high-performance Web Framework with auto-generated OpenAPI / Swagger docs.
- **LangChain & LCEL**: Orchestrating retrieval chains (`langchain-google-genai`, `RecursiveCharacterTextSplitter`, `JsonOutputParser`).
- **Google Gemini 3.6 Flash**: Advanced LLM for synthesis, literature review generation, and multi-turn chat.
- **Uvicorn**: ASGI server implementation for FastAPI.

### Frontend
- **React 19** & **TypeScript**
- **Vite 6**: High-speed frontend tooling & bundling.
- **Tailwind CSS v4**: Modern utility-first UI styling.
- **Lucide React** & **Framer Motion**: Modern UI icons and fluid micro-animations.
- **jsPDF**: Client-side formatted PDF report generation.

---

## 🔑 Environment Variables

The application requires a **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

| Variable Name | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | API Key for Google Gemini 3.6 Flash model | `YOUR_GEMINI_API_KEY_HERE` | **Yes** |
| `PORT` | FastAPI server port | `8000` | No |
| `HOST` | Host address to bind server | `0.0.0.0` | No |

### Frontend Configuration (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable Name | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | API Key for frontend direct calls / fallback | `YOUR_GEMINI_API_KEY_HERE` | **Yes** |
| `VITE_API_BASE_URL` | Base URL of FastAPI backend | `http://localhost:8000` | No |
| `PORT` | Frontend web server port | `3000` | No |

---

## 🚀 Quick Start Guide

### Step 1: Launch the Python FastAPI + LangChain Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY in .env
   ```

4. Start the FastAPI server via Uvicorn:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - **Backend API**: `http://localhost:8000`
   - **Interactive Swagger Docs**: `http://localhost:8000/docs`

> *Tip:* Alternatively, on Linux/macOS you can execute `./run.sh` inside the `backend` directory.

---

### Step 2: Launch the React Frontend

1. In a new terminal at the root of the project, install dependencies:
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

---

## ⚡ Core Features

1. **Multi-Paper LangChain RAG Synthesis**:
   - Executes vector retrieval across indexed research papers simultaneously using `RecursiveCharacterTextSplitter` chunking and cosine similarity matching.
   - LangChain LCEL pipelines generate structured markdown synthesis reports with verifiable `[C1]`, `[C2]` inline citations.

2. **Automated Literature Review Generator**:
   - One-click synthesis of comprehensive, publication-ready literature reviews analyzing background, methodologies, comparative findings, and open research directions.

3. **Live ArXiv Importer & PDF Chunking**:
   - Query live ArXiv repositories in real-time, inspect abstracts, and import research papers directly into the vector store.
   - Upload custom PDF documents or raw text files with automated vector indexing.

4. **Comparative Methodological Matrix**:
   - Side-by-side technical evaluation comparing paradigms, architectures, retrieval techniques, advantages, limitations, and query latency across all indexed papers.

5. **Interactive Knowledge Graph & Chatbot**:
   - Interactive visual network representing relationships between papers, methodologies, and core concepts.
   - Multi-turn research assistant chatbot for targeted paper Q&A.

6. **PDF Report Export**:
   - Export synthesis responses and generated literature reviews directly to formatted PDF files.

---

## 🛰️ REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` or `/api/health` | Backend status check and framework health |
| `GET` | `/api/stats` | Vector database metrics and paper chunk counts |
| `GET` | `/api/papers` | Retrieve all indexed papers (optional `?category=` filter) |
| `GET` | `/api/papers/{id}` | Get single paper details and vector chunk breakdown |
| `DELETE` | `/api/papers/{id}` | Delete paper and remove associated vector chunks |
| `POST` | `/api/papers/reset-session` | Reset vector store (empty state or reload default benchmark papers) |
| `POST` | `/api/upload-paper` | Upload, parse, chunk, and index custom text/PDF paper |
| `POST` | `/api/arxiv/search` | Query live ArXiv research database |
| `POST` | `/api/arxiv/import` | Import and chunk research paper from ArXiv |
| `POST` | `/api/rag/search` | Vector search retrieval test endpoint |
| `POST` | `/api/rag/synthesize` | Multi-paper LCEL RAG synthesis via Gemini 3.6 Flash |
| `POST` | `/api/rag/generate-review` | Generate comprehensive literature review |
| `GET` | `/api/rag/matrix` | Fetch dynamic comparative methodological matrix |
| `POST` | `/api/chat` | Multi-turn paper assistant chatbot endpoint |
| `GET` | `/api/knowledge-graph` | Fetch knowledge graph nodes & edge connections |

---

## 📄 License

MIT License. Built for AI research exploration, multi-paper RAG synthesis, and knowledge extraction.
