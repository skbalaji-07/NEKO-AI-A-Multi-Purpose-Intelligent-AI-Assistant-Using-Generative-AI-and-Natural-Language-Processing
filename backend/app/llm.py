"""LLM adapter — provider, key and model come exclusively from server-side
environment variables. The browser never sees a key. Works with any
OpenAI-compatible chat completions endpoint (OpenAI, Groq, Together,
OpenRouter, local vLLM, etc.)."""

import httpx

from .config import get_settings

SYSTEM_PROMPT = (
    "You are NEKO, a helpful multi-purpose assistant for students and "
    "professionals. Be concise, structured and honest. Use markdown. "
    "If given user memory facts, use them to personalise the answer."
)


async def llm_reply(message: str, memory: list[str], history: list[dict]) -> str | None:
    """Return an LLM completion, or None when no key is configured
    (the API then falls back to the deterministic local engine)."""
    settings = get_settings()
    if not settings.llm_api_key:
        return None

    facts = "\n".join(f"- {f}" for f in memory[:10])
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if facts:
        messages.append({"role": "system", "content": f"Known user facts:\n{facts}"})
    messages.extend(history[-8:])
    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=45) as client:
        res = await client.post(
            f"{settings.llm_base_url}/chat/completions",
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            json={"model": settings.llm_model, "messages": messages, "temperature": 0.6},
        )
        res.raise_for_status()
        data = res.json()
        return data["choices"][0]["message"]["content"]
