"""
literature_review.py
--------------------
Literature Review chain using LangChain Expression Language (LCEL).

Chain structure:
    prompt_template | nemotron_llm | StrOutputParser()
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from services.nemotron_langchain import NemotronLangChain

# ---------------------------------------------------------------------------
# 1. Prompt template
#    {paper_count}, {catalog_str}, and {context_str} are filled at invoke time.
# ---------------------------------------------------------------------------
_SYSTEM = (
    "You are an expert AI Research Synthesizer utilizing Nvidia Nemotron LLM. "
    "Generate a unified, single-document Literature Review report analyzing ALL indexed papers."
)

_HUMAN = """\
Generate a comprehensive scientific Literature Review covering ALL {paper_count} research papers currently indexed in our repository.

INDEXED PAPERS CATALOG ({paper_count} PAPERS):
{catalog_str}

RETRIEVED MULTI-PAPER VECTOR EXCERPTS:
{context_str}

CRITICAL REQUIREMENTS:
1. Cover ALL {paper_count} indexed papers in this single literature review synthesis!
2. Structure the review with clear Markdown headings:
   # Comprehensive Scientific Literature Review ({paper_count} Papers)
   ## 1. Executive Summary & Repository Scope
   ## 2. Paradigm Evolution & Methodological Taxonomies
   ## 3. Side-by-Side Comparative Analysis & Strategic Trade-Offs
   ## 4. Key Findings, Benchmarks & Paradigm Shifts
   ## 5. Open Challenges, Limitations & Future Research Directions
3. Use inline citations [C1], [C2] where applicable.

LITERATURE REVIEW:"""

literature_review_prompt = ChatPromptTemplate.from_messages([
    ("system", _SYSTEM),
    ("human", _HUMAN),
])

# ---------------------------------------------------------------------------
# 2. LLM
# ---------------------------------------------------------------------------
literature_review_llm = NemotronLangChain(temperature=0.25, max_tokens=3000)

# ---------------------------------------------------------------------------
# 3. Output parser
# ---------------------------------------------------------------------------
_output_parser = StrOutputParser()

# ---------------------------------------------------------------------------
# 4. LCEL chain — prompt | llm | parser
# ---------------------------------------------------------------------------
literature_review_chain = literature_review_prompt | literature_review_llm | _output_parser


# ---------------------------------------------------------------------------
# Public API — same signature as before so the router needs no changes.
# ---------------------------------------------------------------------------
async def run_literature_review(paper_count: int, catalog_str: str, context_str: str) -> str:
    """
    Synthesizes a comprehensive Literature Review using the LCEL chain.

    Equivalent to the old manual call but now uses the | pipe operator:
        literature_review_chain = prompt | llm | parser
    """
    return await literature_review_chain.ainvoke({
        "paper_count": paper_count,
        "catalog_str": catalog_str,
        "context_str": context_str,
    })
