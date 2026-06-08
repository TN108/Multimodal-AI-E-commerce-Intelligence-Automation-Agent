import base64
import json
import re

import httpx


OLLAMA_URL = "http://localhost:11434/api/generate"
VLM_MODEL = "qwen2.5vl:3b"


def extract_json_from_text(text: str) -> dict:
    raw_text = text.strip()

    cleaned_text = raw_text

    cleaned_text = re.sub(r"^```json", "", cleaned_text, flags=re.IGNORECASE).strip()
    cleaned_text = re.sub(r"^```", "", cleaned_text).strip()
    cleaned_text = re.sub(r"```$", "", cleaned_text).strip()

    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned_text, re.DOTALL)

    if match:
        json_text = match.group(0)

        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            return {
                "error": "VLM returned JSON-like text but it could not be parsed",
                "raw_response": raw_text,
            }

    return {
        "error": "VLM did not return valid JSON",
        "raw_response": raw_text,
    }


async def analyze_product_image(image_bytes: bytes) -> dict:
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """
You are an e-commerce product image analysis assistant.

Analyze the uploaded product image.

Return ONLY raw valid JSON.
Do not use markdown.
Do not use ```json.
Do not add explanation before or after the JSON.

Return this exact JSON structure:
{
  "product_type": "",
  "category": "",
  "gender": "",
  "colors": [],
  "style": "",
  "material_guess": "",
  "visible_features": [],
  "search_tags": [],
  "short_description": ""
}
"""

    payload = {
        "model": VLM_MODEL,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=300) as client:
        response = await client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()

    result = response.json()
    raw_response = result.get("response", "")

    return extract_json_from_text(raw_response)