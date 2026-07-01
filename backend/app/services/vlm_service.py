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

    This reduces local inference time because local VLMs are slow on large images.
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
    """
    Extract valid JSON from VLM response text.

    The model sometimes returns:
    - raw JSON
    - JSON inside markdown
    - extra text before/after JSON

    This function tries to recover a clean dictionary.
    """
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


def normalize_vlm_analysis(result: dict) -> dict:
    """
    Ensures the VLM result has a stable structure.

    This protects the backend from missing keys.
    """
    if not isinstance(result, dict):
        return {
            "error": "VLM result was not a dictionary",
            "raw_response": str(result),
        }

    if "error" in result:
        return result

    normalized = {
        "is_supported_product": result.get("is_supported_product", True),
        "is_fashion_product": result.get("is_fashion_product", True),
        "detected_object": result.get("detected_object", ""),
        "unsupported_reason": result.get("unsupported_reason", ""),
        "product_type": result.get("product_type", ""),
        "category": result.get("category", ""),
        "gender": result.get("gender", ""),
        "colors": result.get("colors", []),
        "style": result.get("style", ""),
        "material_guess": result.get("material_guess", ""),
        "visible_features": result.get("visible_features", []),
        "search_tags": result.get("search_tags", []),
        "short_description": result.get("short_description", ""),
    }

    if not isinstance(normalized["colors"], list):
        normalized["colors"] = [str(normalized["colors"])]

    if not isinstance(normalized["visible_features"], list):
        normalized["visible_features"] = [str(normalized["visible_features"])]

    if not isinstance(normalized["search_tags"], list):
        normalized["search_tags"] = [str(normalized["search_tags"])]

    return normalized


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
You are an e-commerce product image analyzer for a fashion catalog.

Your first task is to decide whether the main visible object is a supported fashion-related product.

Supported products include:
- clothing
- shirts
- tops
- dresses
- jackets
- coats
- pants
- trousers
- jeans
- shorts
- skirts
- swimwear
- shoes
- sneakers
- sandals
- boots
- bags
- handbags
- purses
- wallets
- jewelry
- jewellery
- watches
- sunglasses
- belts
- fashion accessories

Unsupported objects include:
- fruit
- food
- vegetables
- animals
- vehicles
- electronics
- furniture
- plants
- flowers
- buildings
- rooms
- random non-fashion objects

Important rules:
1. Do NOT force every image into a fashion product category.
2. If the image shows fruit, food, an animal, a car, a phone, furniture, a plant, or any non-fashion object, mark it as unsupported.
3. If the object is unsupported, do not guess clothing, handbag, shoes, jewelry, or accessories.
4. Only analyze the object if it is actually a fashion-related product.
5. Ignore background, lighting, room, face, body pose, furniture, and non-product objects.
6. Return ONLY raw valid JSON.
7. Do not use markdown.
8. Do not add explanation before or after the JSON.

If the image is NOT a supported fashion product, return this exact JSON structure:
{
  "is_supported_product": false,
  "is_fashion_product": false,
  "detected_object": "",
  "unsupported_reason": "",
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

If the image IS a supported fashion product, return this exact JSON structure:
{
  "is_supported_product": true,
  "is_fashion_product": true,
  "detected_object": "",
  "unsupported_reason": "",
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

Field rules for supported products:
- product_type: specific product name, such as Handbag, Sneakers, Shirt, Dress, Necklace
- category: broad category, such as Accessories, Footwear, Clothing, Jewelry, Bags
- gender: Male, Female, Unisex, or empty string if unclear
- colors: list of visible product colors
- style: style name if visible, otherwise empty string
- material_guess: likely material if inferable, otherwise empty string
- visible_features: list of visible product features
- search_tags: useful search tags for semantic product search
- short_description: one short product-focused sentence
"""

    payload = {
        "model": VLM_MODEL,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
        "keep_alive": "30m",
        "options": {
            "temperature": 0,
            "num_predict": 350,
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

    parsed_result = extract_json_from_text(raw_response)

    return normalize_vlm_analysis(parsed_result)