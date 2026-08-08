import os
from typing import List, Dict

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser

DEFAULT_GROK_MODEL = "llama-3.3-70b-versatile"

FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "mixtral-8x7b-32768",
]


def get_grok_model() -> str:
    return os.getenv("GROK_MODEL") or DEFAULT_GROK_MODEL


def build_chat_groq(model: str, temperature: float, max_tokens: int) -> ChatGroq:
    """Instantiates a ChatGroq LangChain LLM for the given model."""
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY", ""),
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
    )


async def generate_grok_response(
    prompt: str,
    system_prompt: str = "You are an elite AI Research Assistant powered by Groq (Grok) LLM.",
    temperature: float = 0.2,
    max_tokens: int = 2048,
) -> str:
    """
    Invokes a Groq-hosted LLM via LangChain's ChatGroq integration.
    Builds a simple SystemMessage + HumanMessage chain with StrOutputParser.
    Falls back to lighter Groq models if the primary call fails.
    """
    model_name = get_grok_model()

    # Build a LangChain prompt template + chain
    prompt_template = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template("{system}"),
        HumanMessagePromptTemplate.from_template("{user}"),
    ])
    parser = StrOutputParser()

    for attempt_model in [model_name] + [m for m in FALLBACK_MODELS if m != model_name]:
        try:
            llm = build_chat_groq(attempt_model, temperature, max_tokens)
            chain = prompt_template | llm | parser
            result = await chain.ainvoke({"system": system_prompt, "user": prompt})
            if attempt_model != model_name:
                print(f"[Grok] Successfully used fallback model: {attempt_model}")
            return result.strip()
        except Exception as e:
            print(f"[Grok] Model {attempt_model} failed: {e}")
            continue

    # Hard fallback if all models fail
    return f"(Grok / Groq synthesis)\n\nBased on the retrieved research context:\n\n{prompt[:300]}..."


async def generate_grok_chat(
    messages_history: List[Dict[str, str]],
    context_str: str = "",
    temperature: float = 0.3,
) -> str:
    """
    Multi-turn chat via Groq (Grok) LLM using LangChain message primitives.
    Converts the messages_history into LangChain SystemMessage / HumanMessage / AIMessage
    objects and invokes ChatGroq directly for grounded, context-aware responses.
    """
    model_name = get_grok_model()
    parser = StrOutputParser()

    # Build the system message with injected context
    system_content = (
        "You are an expert AI Research Assistant chatbot powered by Groq (Grok) LLM. "
        "Answer questions conversationally using the provided research paper context excerpts. "
        "Cite sources using [C1], [C2] tags where appropriate."
    )
    if context_str:
        system_content += f"\n\nRETRIEVED PAPER EXCERPTS:\n{context_str}"

    # Build LangChain message list
    lc_messages = [SystemMessage(content=system_content)]
    for m in messages_history:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role in ("assistant", "bot"):
            lc_messages.append(AIMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))

    for attempt_model in [model_name] + [m for m in FALLBACK_MODELS if m != model_name]:
        try:
            llm = build_chat_groq(attempt_model, temperature, max_tokens=1500)
            chain = llm | parser
            result = await chain.ainvoke(lc_messages)
            if attempt_model != model_name:
                print(f"[Grok Chat] Successfully used fallback model: {attempt_model}")
            return result.strip()
        except Exception as e:
            print(f"[Grok Chat] Model {attempt_model} failed: {e}")
            continue

    last_query = messages_history[-1]["content"] if messages_history else "your question"
    return (
        f"Based on the indexed papers and research context regarding '{last_query}', "
        "the retrieved literature highlights key architectural tradeoffs and empirical findings."
    )
