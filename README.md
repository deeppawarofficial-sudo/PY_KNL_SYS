# AI Multi-Paper Knowledge Synthesizer 📚⚡

A full-stack, state-of-the-art research paper knowledge synthesis engine powered by **Gemini 3.6 Flash** and an in-memory vector database collection (**Qdrant emulation**). 

The platform allows researchers and developers to query across multiple indexed AI papers, execute hybrid (BM25 + Cosine Similarity) vector retrieval, generate synthesis reports with verifiable inline citations `[C1]`, `[C2]`, interact with an AI research paper chatbot, and explore comparative methodological matrices & knowledge graph networks.

---

## 🏛️ Architecture & Project Structure (MVC Pattern)

The application follows a clean **Model-View-Controller (MVC)** architectural pattern to maintain modularity, testability, and separation of concerns:

```
├── .env.example                # Environment variables template
├── .env                        # Local environment configuration
├── .gitignore                  # Git ignore rules for node_modules, build artifacts, and secrets
├── README.md                   # Comprehensive documentation
├── package.json                # Project dependencies and npm scripts
├── server.ts                   # Express server entry point with Vite middleware
│
├── src/
│   ├── server/                 # MVC Backend Server Architecture
│   │   ├── models/             # Database Models & Vector Data Stores
│   │   │   ├── paperModel.ts       # Paper & Chunk database collections & CRUD
│   │   │   └── vectorStoreModel.ts # Recursive text chunker, Cosine & BM25 hybrid search engine
│   │   ├── controllers/        # Business Logic Controllers
│   │   │   ├── paperController.ts       # Paper indexing, PDF upload, & metadata
│   │   │   ├── arxivController.ts       # Live ArXiv API search & import integration
│   │   │   ├── ragController.ts         # Hybrid vector retrieval & Gemini synthesis
│   │   │   ├── chatController.ts        # Interactive paper assistant chatbot
│   │   │   └── knowledgeGraphController.ts # Knowledge graph network dataset
│   │   ├── services/           # External API & SDK Integrations
│   │   │   └── geminiService.ts    # Google GenAI SDK (Gemini 3.6 Flash client)
│   │   └── routes/             # Express API Endpoints Router
│   │       ├── paperRoutes.ts      # /api/stats, /api/papers, /api/upload-paper
│   │       ├── arxivRoutes.ts      # /api/arxiv/search, /api/arxiv/import
│   │       ├── ragRoutes.ts        # /api/rag/search, /api/rag/synthesize, /api/rag/generate-review
│   │       ├── chatRoutes.ts       # /api/chat
│   │       ├── knowledgeGraphRoutes.ts # /api/knowledge-graph
│   │       └── index.ts            # Aggregated API Router
│   │
│   ├── components/             # React Frontend UI Components
│   │   ├── SynthesisWorkspace.tsx       # Query input, scope selection, preset prompts
│   │   ├── SynthesizedResponseView.tsx  # Synthesis report renderer with inline citations
│   │   ├── ResearchChatbot.tsx          # Multi-turn paper Q&A assistant
│   │   ├── PaperLibrary.tsx             # Paper collection & raw vector chunk inspector with delete
│   │   ├── NewSessionModal.tsx          # Start fresh session or reset to benchmark papers
│   │   ├── ArxivImporter.tsx            # Live ArXiv paper importer
│   │   ├── PdfUploadModal.tsx           # Custom PDF / text file uploader
│   │   ├── LiteratureReviewView.tsx     # Automated review generator
│   │   ├── ComparisonMatrixView.tsx     # Methodological matrix comparison
│   │   ├── KnowledgeGraphView.tsx       # Interactive network graph canvas
│   │   └── CitationModal.tsx            # Verifiable citation text chunk modal
│   │
│   ├── data/                   # Pre-indexed Landmark Research Papers
│   │   └── presetPapers.ts     # GraphRAG, DeepSeek-R1, Traditional RAG, CoT, etc.
│   │
│   ├── services/               # Frontend API Fetch Client
│   │   └── api.ts              # Frontend service calls to /api/* endpoints
│   │
│   ├── types.ts                # Shared TypeScript Type Definitions
│   ├── App.tsx                 # Main Application Layout & Navigation
│   └── main.tsx                # Client Entry Point
```

---

## 🔑 Environment Variables

The application relies on environment variables for model access and server runtime.

Copy `.env.example` to create `.env`:

```bash
cp .env.example .env
```

| Variable Name | Description | Default Value | Required |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | API Key for Google Gemini 3.6 Flash model calls | `YOUR_GEMINI_API_KEY_HERE` | **Yes** |
| `PORT` | Web server listening port | `3000` | No |
| `NODE_ENV` | Application environment (`development` or `production`) | `development` | No |
| `APP_URL` | Base application URL | `http://localhost:3000` | No |

---

## ⚡ Core Features

1. **Multi-Paper RAG Synthesis Engine**:
   - Queries across indexed research papers simultaneously.
   - Combines Cosine Similarity with BM25 term weighting (Reciprocal Rank Fusion) for retrieval.
   - Produces synthesized markdown reports with verifiable `[C1]`, `[C2]` inline citations.

2. **Interactive Paper Assistant Chatbot**:
   - Multi-turn conversational Q&A grounded in retrieved paper excerpts.
   - Scoped to single papers or the entire knowledge base.

3. **Live ArXiv Importer & Custom PDF Chunking**:
   - Query ArXiv directly in real-time and import research papers into the vector store.
   - Upload custom PDF files or raw text papers with automated recursive text splitting.

4. **Comparative Methodological Matrix**:
   - Side-by-side technical evaluation of architectures, advantages, limitations, and latency.

5. **Interactive Knowledge Graph & Concept Map**:
   - Visual network depicting relationships between papers, vector indexing methods, and concepts.

---

## 🚀 Getting Started & Scripts

### Installation

```bash
npm install
```

### Development Mode

Runs the backend Express server with `tsx` and Vite middleware on port 3000:

```bash
npm run dev
```

### Type Checking & Linting

```bash
npm run lint
```

### Production Build & Launch

```bash
npm run build
npm run start
```

---

## 🛰️ REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check and timestamp |
| `GET` | `/api/stats` | Vector database metrics & configuration |
| `GET` | `/api/papers` | Retrieve all indexed papers with category filtering |
| `GET` | `/api/papers/:id` | Get single paper details & raw vector chunks |
| `DELETE` | `/api/papers/:id` | Delete paper and all associated vector chunks from index |
| `POST` | `/api/papers/reset-session` | Start fresh empty session or reset to default landmark papers |
| `POST` | `/api/upload-paper` | Parse, chunk, and index custom PDF or text paper |
| `POST` | `/api/arxiv/search` | Search live ArXiv research database |
| `POST` | `/api/arxiv/import` | Import and chunk paper from ArXiv |
| `POST` | `/api/rag/search` | Vector search retrieval test endpoint |
| `POST` | `/api/rag/synthesize` | Multi-paper RAG synthesis via Gemini 3.6 Flash |
| `POST` | `/api/rag/generate-review` | Generate publication-ready literature review |
| `POST` | `/api/chat` | Multi-turn paper assistant chatbot |
| `GET` | `/api/knowledge-graph` | Fetch knowledge graph nodes & links |

---

## 📄 License

MIT License. Designed for AI research exploration and knowledge synthesis.
