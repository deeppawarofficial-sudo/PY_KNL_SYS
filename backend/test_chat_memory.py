import asyncio
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from chains.chat_graph import run_chat_pipeline

async def test_memory_persistence():
    thread_id = "test_memory_thread_1"
    print(f"\n==========================================")
    print(f"Testing LangGraph MemorySaver Thread Persistence: {thread_id}")
    print(f"==========================================")

    # Turn 1: Define a subject
    turn_1_query = "What is Group Relative Policy Optimization (GRPO)?"
    print(f"\n[Turn 1 Query]: {turn_1_query}")
    turn_1_res = await run_chat_pipeline(
        query=turn_1_query,
        thread_id=thread_id,
        messages_history=[{"role": "user", "content": turn_1_query}]
    )
    print(f"\n[Turn 1 Response Snippet]:\n{turn_1_res['answer'][:350]}...\n")
    print(f"Total Messages in Checkpoint: {turn_1_res['totalMessages']}")
    print(f"Citations Retrieved: {len(turn_1_res['citations'])}")

    assert turn_1_res['totalMessages'] >= 2, "Should have at least 2 messages in state (user + ai)"

    # Turn 2: Follow-up using pronouns ("Who proposed it and what does it eliminate?")
    # Notice we don't repeat "GRPO". The model MUST use MemorySaver state to know what "it" is!
    turn_2_query = "Who proposed it and what does it eliminate compared to standard PPO?"
    print(f"\n[Turn 2 Query (Pronoun follow-up)]: {turn_2_query}")
    turn_2_res = await run_chat_pipeline(
        query=turn_2_query,
        thread_id=thread_id
    )
    print(f"\n[Turn 2 Response Snippet]:\n{turn_2_res['answer'][:350]}...\n")
    print(f"Total Messages in Checkpoint: {turn_2_res['totalMessages']}")

    assert turn_2_res['totalMessages'] >= 4, "Should have at least 4 messages in state across 2 turns"
    assert "deepseek" in turn_2_res['answer'].lower() or "critic" in turn_2_res['answer'].lower() or "grpo" in turn_2_res['answer'].lower(), \
        "Turn 2 should successfully reference DeepSeek or critic model based on conversational context from Turn 1!"

    print("\nSUCCESS: Multi-turn memory persistence verified with MemorySaver!\n")

if __name__ == "__main__":
    asyncio.run(test_memory_persistence())
