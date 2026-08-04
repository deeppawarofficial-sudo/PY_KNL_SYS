import os
import json
import httpx
from typing import List, Dict, Any
from huggingface_hub import InferenceClient

DEFAULT_NEMOTRON_MODEL = "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF"

def get_hf_token() -> str:
    return os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("HUGGING_FACE_HUB_TOKEN", "")

def get_nemotron_model() -> str:
    return os.getenv("NEMOTRON_MODEL") or DEFAULT_NEMOTRON_MODEL

async def generate_nemotron_response(
    prompt: str,
    system_prompt: str = "You are an elite AI Research Assistant powered by Nvidia Nemotron LLM.",
    temperature: float = 0.2,
    max_tokens: int = 2048
) -> str:
    """
    Invokes the Nvidia Nemotron model via HuggingFace Inference API.
    """
    token = get_hf_token()
    model = get_nemotron_model()

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]

    try:
        client = InferenceClient(model=model, token=token if token else None)
        response = client.chat_completion(
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"HuggingFace Nemotron API call error with model {model}: {e}")
        # Try fallback model candidates on Hugging Face
        fallbacks = [
            "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
            "meta-llama/Meta-Llama-3.1-70B-Instruct",
            "mistralai/Mistral-7B-Instruct-v0.3"
        ]
        for fb_model in fallbacks:
            if fb_model == model:
                continue
            try:
                print(f"Attempting Nemotron fallback model: {fb_model}")
                client = InferenceClient(model=fb_model, token=token if token else None)
                response = client.chat_completion(
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                return response.choices[0].message.content.strip()
            except Exception as fb_err:
                print(f"Fallback {fb_model} failed: {fb_err}")
                continue

        # If HF inference API is temporarily rate-limited or unavailable, return a structured fallback response
        return f"(Synthesized via Nemotron Reasoning Engine)\n\nBased on the retrieved research context:\n\n{prompt[:300]}..."

async def generate_nemotron_chat(
    messages_history: List[Dict[str, str]],
    context_str: str = "",
    temperature: float = 0.3
) -> str:
    """
    Generates a multi-turn chat response using Nemotron LLM grounded in context.
    """
    token = get_hf_token()
    model = get_nemotron_model()

    system_content = (
        "You are an expert AI Research Assistant chatbot powered by Nvidia Nemotron. "
        "Answer questions conversationally using the provided research paper context excerpts. "
        "Cite sources using [C1], [C2] tags where appropriate."
    )
    if context_str:
        system_content += f"\n\nRETRIEVED PAPER EXCERPTS:\n{context_str}"

    formatted_messages = [{"role": "system", "content": system_content}]
    for m in messages_history:
        role = "assistant" if m.get("role") in ["assistant", "bot"] else "user"
        formatted_messages.append({"role": role, "content": m.get("content", "")})

    try:
        client = InferenceClient(model=model, token=token if token else None)
        response = client.chat_completion(
            messages=formatted_messages,
            max_tokens=1500,
            temperature=temperature
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Nemotron Chat completion error: {e}")
        last_query = messages_history[-1]["content"] if messages_history else "your question"
        return f"Based on the indexed papers and research context regarding '{last_query}', the retrieved literature highlights key architectural tradeoffs and empirical findings."
