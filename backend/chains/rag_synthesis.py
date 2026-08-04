import os
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

def get_rag_synthesis_chain():
    """
    Constructs a LangChain LCEL (LangChain Expression Language) Runnable Sequence
    using ChatGoogleGenerativeAI and PromptTemplate for multi-paper RAG synthesis.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key if api_key else None,
        temperature=0.2,
    )

    template = """You are an elite AI Research Assistant and Literature Synthesizer powered by LangChain.
Synthesize a comprehensive, publication-ready research response for the query based on the retrieved vector excerpts from academic papers.

USER QUERY:
{query}

RETRIEVED VECTOR EVIDENCE:
{context}

REQUIREMENTS:
1. Provide a direct, authoritative, and well-structured response synthesizing evidence across papers.
2. Use inline citations [C1], [C2], etc. matching the provided context excerpts.
3. Highlight core methodological tradeoffs, benchmark results, and consensus findings.
4. Format output in clean Markdown.

SYNTHESIZED RESPONSE:"""

    prompt = PromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()
    return chain
