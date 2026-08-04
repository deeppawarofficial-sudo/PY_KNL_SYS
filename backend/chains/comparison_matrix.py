import os
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

def get_comparison_matrix_chain():
    """
    Constructs a LangChain chain for evaluating indexed research papers
    and returning a structured JSON comparison matrix.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key if api_key else None,
        temperature=0.1,
    )

    template = """Analyze these {paper_count} research papers indexed in our repository and generate a structured JSON comparison matrix evaluating ALL of them.

INDEXED PAPERS:
{papers_json}

Return a valid JSON object with a "matrix" array containing objects for EACH paper in the repository with these exact keys:
- "paradigm": Short paradigm or architecture name
- "paper": Title with year (e.g., "From Local to Global: A Graph RAG Approach (2024)")
- "architecture": Technical architecture overview
- "retrievalType": Retrieval mechanism or reasoning technique
- "bestUseCase": Ideal use case scenario
- "keyAdvantage": Main performance or functional advantage
- "mainLimitation": Primary trade-off or constraint
- "indexingCost": Indexing token or compute cost (e.g. Low, Moderate, High)
- "queryLatency": Expected query response latency (e.g. "< 10ms", "~1.5s")

RETURN ONLY VALID JSON:"""

    prompt = PromptTemplate.from_template(template)
    chain = prompt | llm | JsonOutputParser()
    return chain
