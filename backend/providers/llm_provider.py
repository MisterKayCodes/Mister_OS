import os
import httpx
from typing import List, Dict, Any

class LLMProvider:
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    @classmethod
    def get_api_key(cls) -> str:
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise ValueError("GROQ_API_KEY not configured. Ensure .env is loaded.")
        return key

    @classmethod
    async def generate_completion(
        cls, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.5, 
        max_tokens: int = 1024,
        model: str = "llama-3.1-8b-instant"
    ) -> str:
        """
        Sends a raw payload to the LLM and returns the raw string response.
        The Brain/Services determine what the messages contain.
        """
        headers = {
            "Authorization": f"Bearer {cls.get_api_key()}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(cls.GROQ_API_URL, headers=headers, json=payload, timeout=30.0)
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"]
