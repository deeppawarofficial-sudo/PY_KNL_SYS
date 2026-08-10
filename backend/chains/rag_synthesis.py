"""
rag_synthesis.py
----------------
RAG synthesis chain using LangChain Expression Language (LCEL).

Chain structure:
    prompt_template | nemotron_llm | StrOutputParser()

The | pipe operator works because every component (ChatPromptTemplate,
NemotronLangChain, StrOutputParser) is a LangChain Runnable.
"""

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from services.nemotron_langchain import NemotronLangChain

# ---------------------------------------------------------------------------
# 1. Prompt template — defines the structure of the message sent to the LLM.
#    {query} and {context_str} are filled in at invoke time.
# ---------------------------------------------------------------------------
_SYSTEM = (
    "You are an elite AI Research Assistant and Literature Synthesizer powered by Nvidia Nemotron LLM. "
    "Synthesize an authoritative research response for the user query based on the retrieved vector evidence. "
    "Include verifiable inline citations [C1], [C2], etc. matching the context excerpts."
)

_HUMAN = """\
USER RESEARCH QUERY:
{query}

RETRIEVED MULTI-PAPER VECTOR EXCERPTS:
{context_str}

REQUIREMENTS:
1. Provide a direct, structured response synthesizing findings across papers.
2. Use inline citations [C1], [C2], etc. to credit source context lines.
3. Highlight architectural tradeoffs, benchmark results, and limitations.
4. Format in clean, readable Markdown.

SYNTHESIZED RESPONSE:"""

rag_synthesis_prompt = ChatPromptTemplate.from_messages([
    ("system", _SYSTEM),
    ("human", _HUMAN),
])

# ---------------------------------------------------------------------------
# 2. LLM — NemotronLangChain is a BaseChatModel, so it is a Runnable.
# ---------------------------------------------------------------------------
rag_synthesis_llm = NemotronLangChain(temperature=0.2, max_tokens=2000)

# ---------------------------------------------------------------------------
# 3. Output parser — strips the AIMessage wrapper and returns a plain str.
# ---------------------------------------------------------------------------
_output_parser = StrOutputParser()

# ---------------------------------------------------------------------------
# 4. LCEL chain — composed with the | pipe operator.
#    prompt_template | llm | parser
# ---------------------------------------------------------------------------
rag_synthesis_chain = rag_synthesis_prompt | rag_synthesis_llm | _output_parser


# ---------------------------------------------------------------------------
# Public API — same signature as before so the router needs no changes.
# ---------------------------------------------------------------------------
async def run_rag_synthesis(query: str, context_str: str) -> str:
    """
    Executes multi-paper RAG synthesis using the LCEL chain.

    Equivalent to the old manual call but now uses the | pipe operator:
        rag_synthesis_chain = prompt | llm | parser
    """
    return await rag_synthesis_chain.ainvoke({
        "query": query,
        "context_str": context_str,
    })
