# AI Multi-Paper Knowledge Synthesizer 📚⚡

A full-stack, state-of-the-art research paper knowledge synthesis engine powered by **Python (FastAPI + Hugging Face)**, **Nvidia Nemotron LLM**, **BAAI/bge-large-en-v1.5 Vector Embeddings**, and a **React 19 (TypeScript + Vite + Tailwind CSS)** frontend.

The platform allows researchers and developers to query across multiple indexed AI papers, execute vector retrieval using **BAAI/bge-large-en-v1.5** embeddings and cosine similarity search, generate synthesis reports with verifiable inline citations `[C1]`, `[C2]`, generate publication-ready literature reviews via **Nvidia Nemotron**, interact with an AI research paper chatbot, and explore comparative methodological matrices & knowledge graph networks.

---

## 🏛️ Architecture & Project Structure

The project uses a decoupled architecture with a **Python FastAPI + Hugging Face (Nemotron + BAAI/bge-large-en-v1.5)** backend engine and a modern **React 19 + TypeScript** frontend:

```
├── backend/                        # Python FastAPI Backend
│   ├── chains/                     # Synthesis & Reasoning Chains
│   │   ├── rag_synthesis.py        # Multi-paper RAG synthesis via Nemotron with inline citations
│   │   ├── literature_review.py    # Automated literature review synthesis chain
│   │   └── comparison_matrix.py    # Dynamic JSON comparative matrix generation chain
│   ├── routers/                    # FastAPI APIRouter Endpoints
│   │   ├── arxiv.py                # ArXiv search & live paper import (/api/arxiv/*)
│   │   ├── rag.py                  # RAG search, synthesis, review & matrix (/api/rag/*)
│   │   ├── papers.py               # Paper collection management & PDF upload (/api/papers/*)
│   │   └── knowledge.py            # Multi-turn chatbot & Knowledge Graph (/api/chat, /api/knowledge-graph)
│   ├── services/                   # Backend Logic Services
│   │   ├── nemotron_llm.py         # Nvidia Nemotron LLM inference service (Hugging Face API)
│   │   ├── vector_store.py         # BAAI/bge-large-en-v1.5 vector store & cosine similarity search
│   │   └── arxiv_service.py        # Live ArXiv XML API fetcher & parser
│   ├── main.py                     # FastAPI application entrypoint & sample paper pre-seeding
│   ├── requirements.txt            # Python dependencies (FastAPI, huggingface-hub, sentence-transformers)
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
- **Nvidia Nemotron LLM**: `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` for reasoning, synthesis, and Q&A.
- **BAAI/bge-large-en-v1.5**: High-dimensional dense vector embedding model downloaded from Hugging Face.
- **Hugging Face Hub API**: `huggingface-hub` & `sentence-transformers` for embeddings & model inference.
- **Uvicorn**: ASGI server implementation for FastAPI.

### Frontend
- **React 19** & **TypeScript**
- **Vite 6**: High-speed frontend tooling & bundling.
- **Tailwind CSS v4**: Modern utility-first UI styling.
- **Lucide React** & **Framer Motion**: Modern UI icons and fluid micro-animations.
- **jsPDF**: Client-side formatted PDF report generation.

---

## 🔑 Environment Variables

The application is configured to use Hugging Face for both **Nemotron LLM** inference and **BAAI/bge-large-en-v1.5** embeddings.

### Backend Configuration (`backend/.env`)

```env
HF_TOKEN=your_hf_token_here
HUGGINGFACEHUB_API_TOKEN=your_hf_token_here
NEMOTRON_MODEL=nvidia/Llama-3.1-Nemotron-70B-Instruct-HF
EMBEDDING_MODEL=BAAI/bge-large-en-v1.5
PORT=8000
HOST=0.0.0.0
```

| Variable Name | Description | Default Value | Required |
| :--- | :--- | :--- | :--- |
| `HF_TOKEN` | Hugging Face Access Token | `your_hf_token_here` | **Yes** |
| `NEMOTRON_MODEL` | Hugging Face Nemotron LLM Repository ID | `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` | **Yes** |
| `EMBEDDING_MODEL` | Hugging Face Embedding Model Repository ID | `BAAI/bge-large-en-v1.5` | **Yes** |
| `PORT` | FastAPI server port | `8000` | No |

---

## 🚀 Quick Start Guide

### Step 1: Launch the Python FastAPI Backend

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

3. Start the FastAPI server via Uvicorn:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - **Backend API**: `http://localhost:8000`
   - **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

### Step 2: Launch the React Frontend

1. In a new terminal tab at the root of the project, install dependencies:
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

---

## 📄 License

MIT License. Built for AI research exploration, multi-paper RAG synthesis, and knowledge extraction.
