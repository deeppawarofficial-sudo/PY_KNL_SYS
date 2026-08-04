# 🚀 How to Run the App Locally (Python FastAPI + LangChain + React)

This project features a modern **React (Vite + Tailwind CSS)** frontend and a **Python (FastAPI + LangChain)** backend.

---

## 📋 Prerequisites

1. **Node.js** (v18+)
2. **Python** (v3.10+)
3. **Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

---

## 🛠️ Step 1: Set Up the FastAPI + LangChain Backend

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set your Gemini API key in `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualGeminiApiKeyHere
   ```

4. Start the FastAPI server using Uvicorn:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The FastAPI server will be running live at:* `http://localhost:8000`
   *Interactive Swagger API Docs:* `http://localhost:8000/docs`

---

## 💻 Step 2: Set Up & Start the React Frontend

1. Open a new terminal tab at the root of the project:
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:3000` or `http://localhost:5173`.

---

## 🧠 LangChain Architecture in `/backend`

- **`backend/chains/rag_synthesis.py`**: LangChain LCEL sequence combining `PromptTemplate`, `ChatGoogleGenerativeAI`, and `StrOutputParser` for multi-paper RAG synthesis.
- **`backend/chains/literature_review.py`**: LangChain pipeline that synthesizes all indexed research papers into a single structured report.
- **`backend/chains/comparison_matrix.py`**: LangChain pipeline utilizing `JsonOutputParser` for dynamic matrix evaluation.
- **`backend/services/vector_store.py`**: Uses `langchain.text_splitter.RecursiveCharacterTextSplitter` to chunk academic papers for vector indexing.

---

## 📑 Features Summary

- **ArXiv Paper Importer**: Search and fetch live papers from ArXiv (up to 100 per query) and index them immediately.
- **Multi-Paper RAG Synthesis**: Retrieve vector chunks across multiple papers and generate grounded answers with citations.
- **Literature Review Synthesis**: Generate a unified literature review for all repository papers with one click.
- **PDF Export**: Download syntheses and literature reviews as formatted PDF reports.
