import os
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

def get_literature_review_chain():
    """
    Constructs a LangChain LCEL chain for generating a comprehensive single-document
    Literature Review across all indexed research papers.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key if api_key else None,
        temperature=0.25,
    )

    template = """You are an expert AI Research Synthesizer utilizing LangChain chains.
Generate a unified, single-document Literature Review report synthesizing ALL {paper_count} research papers currently indexed in our repository catalog.

INDEXED PAPERS CATALOG ({paper_count} PAPERS):
{catalog}

RETRIEVED MULTI-PAPER VECTOR EXCERPTS:
{context}

CRITICAL REQUIREMENTS:
1. Cover ALL {paper_count} indexed papers in this single literature review synthesis! Do not omit any paper.
2. Structure the review with clear Markdown headings:
   # Comprehensive Scientific Literature Review ({paper_count} Papers)
   ## 1. Executive Summary & Scope of the Repository
   ## 2. Paradigm Evolution & Methodological Taxonomies
   ## 3. Side-by-Side Comparative Analysis & Strategic Trade-Offs
   ## 4. Key Findings, Benchmarks & Paradigm Shifts Across All Papers
   ## 5. Open Challenges, Limitations & Future Research Directions
3. Use inline citations [C1], [C2] to support claims.

LITERATURE REVIEW:"""

    prompt = PromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()
    return chain
