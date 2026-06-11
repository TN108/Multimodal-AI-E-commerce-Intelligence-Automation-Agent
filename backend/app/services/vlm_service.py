import base64
import json
import re
from io import BytesIO

import httpx
from PIL import Image, ImageOps, UnidentifiedImageError


OLLAMA_URL = "http://localhost:11434/api/generate"
VLM_MODEL = "qwen2.5vl:3b"


def compress_image_for_vlm(
    image_bytes: bytes,
    max_side: int = 512,
    quality: int = 80,
) -> bytes:
    """
    Resize and compress image before sending it to the VLM.

    This reduces CPU inference time because local VLMs are slow on large images.
    """
    try:
        image = Image.open(BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")

        image.thumbnail((max_side, max_side))

        buffer = BytesIO()
        image.save(
            buffer,
            format="JPEG",
            quality=quality,
            optimize=True,
        )

        return buffer.getvalue()

    except UnidentifiedImageError:
        raise ValueError("Invalid image file. Could not read uploaded image.")


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
    try:
        compressed_image_bytes = compress_image_for_vlm(
            image_bytes=image_bytes,
            max_side=512,
            quality=80,
        )
    except ValueError as error:
        return {
            "error": str(error),
        }

    image_base64 = base64.b64encode(compressed_image_bytes).decode("utf-8")

    prompt = """
Analyze the main clothing product in this image for an e-commerce catalog.

Ignore the person, face, pose, phone, chair, room, furniture, background, and lighting.
Only describe the sellable clothing item.
Do not describe the full scene.
Do not include non-product objects in visible_features or search_tags.

Return ONLY raw valid JSON.
Do not use markdown.
Do not add explanation before or after the JSON.

Use this exact JSON structure:
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
        "keep_alive": "30m",
        "options": {
            "temperature": 0,
            "num_predict": 250,
            "num_ctx": 2048,
        },
    }

    timeout = httpx.Timeout(
        connect=10,
        read=300,
        write=30,
        pool=10,
    )

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()

    result = response.json()
    raw_response = result.get("response", "")

    return extract_json_from_text(raw_response)