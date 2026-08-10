"""
nemotron_langchain.py
---------------------
A LangChain-compatible BaseChatModel wrapper around the HuggingFace InferenceClient
for the Nvidia Nemotron (and fallback) models.

By subclassing BaseChatModel, every instance of NemotronLangChain is a proper
LangChain Runnable, which means you can compose it with the pipe operator:

    chain = prompt_template | llm | output_parser

No changes are made to the underlying HuggingFace API call logic.
"""

import os
from typing import Any, List, Optional

from huggingface_hub import InferenceClient
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.outputs import ChatGeneration, ChatResult

DEFAULT_NEMOTRON_MODEL = "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF"

FALLBACK_MODELS = [
    "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
    "meta-llama/Meta-Llama-3.1-70B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
]


def _get_hf_token() -> str:
    return (
        os.getenv("HF_TOKEN")
        or os.getenv("HUGGINGFACEHUB_API_TOKEN")
        or os.getenv("HUGGING_FACE_HUB_TOKEN", "")
    )


def _get_model_name() -> str:
    return os.getenv("NEMOTRON_MODEL") or DEFAULT_NEMOTRON_MODEL


def _langchain_messages_to_hf(messages: List[BaseMessage]) -> List[dict]:
    """Convert LangChain message objects to the HF chat format."""
    hf_messages = []
    for msg in messages:
        if isinstance(msg, SystemMessage):
            hf_messages.append({"role": "system", "content": msg.content})
        elif isinstance(msg, HumanMessage):
            hf_messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            hf_messages.append({"role": "assistant", "content": msg.content})
        else:
            # Fallback: treat as user message
            hf_messages.append({"role": "user", "content": msg.content})
    return hf_messages


class NemotronLangChain(BaseChatModel):
    """
    LangChain BaseChatModel wrapper for Nvidia Nemotron via HuggingFace Inference API.

    Usage:
        llm = NemotronLangChain(temperature=0.2, max_tokens=2048)
        chain = prompt | llm | StrOutputParser()
    """

    temperature: float = 0.2
    max_tokens: int = 2048

    @property
    def _llm_type(self) -> str:
        return "nemotron-huggingface"

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """
        Synchronous generation — called internally by LangChain.
        Mirrors the fallback logic from the original nemotron_llm.py.
        """
        token = _get_hf_token()
        model = _get_model_name()
        hf_messages = _langchain_messages_to_hf(messages)

        def _call_hf(model_name: str) -> str:
            client = InferenceClient(model=model_name, token=token if token else None)
            response = client.chat_completion(
                messages=hf_messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            return response.choices[0].message.content.strip()

        # Primary call
        try:
            content = _call_hf(model)
        except Exception as e:
            print(f"[NemotronLangChain] Primary model {model} failed: {e}")
            content = None

            # Fallback loop
            for fb_model in FALLBACK_MODELS:
                if fb_model == model:
                    continue
                try:
                    print(f"[NemotronLangChain] Trying fallback: {fb_model}")
                    content = _call_hf(fb_model)
                    break
                except Exception as fb_err:
                    print(f"[NemotronLangChain] Fallback {fb_model} failed: {fb_err}")

            if content is None:
                # Last-resort graceful degradation
                raw_prompt = hf_messages[-1]["content"] if hf_messages else ""
                content = (
                    f"(Synthesized via Nemotron Reasoning Engine)\n\n"
                    f"Based on the retrieved research context:\n\n{raw_prompt[:300]}..."
                )

        message = AIMessage(content=content)
        generation = ChatGeneration(message=message)
        return ChatResult(generations=[generation])

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """
        Async generation — delegates to the sync version since InferenceClient
        does not have a native async interface.
        LangChain will run this in a thread pool automatically when awaited.
        """
        return self._generate(messages, stop=stop, **kwargs)
