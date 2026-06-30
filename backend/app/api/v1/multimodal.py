import inspect

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.models.user import User
from app.services.vlm_service import analyze_product_image
from app.utils.auth_dependencies import get_current_user
from app.utils.embeddings import generate_embedding
from app.services.qdrant_service import search_products
from app.services.product_service import expand_query


router = APIRouter(prefix="/multimodal", tags=["Multimodal Search"])


DEFAULT_MIN_SCORE = 0.40


CATEGORY_ALIASES = {
    # Footwear
    "footwear": "footwear",
    "shoe": "footwear",
    "shoes": "footwear",
    "sneaker": "footwear",
    "sneakers": "footwear",
    "trainer": "footwear",
    "trainers": "footwear",
    "boot": "footwear",
    "boots": "footwear",
    "heel": "footwear",
    "heels": "footwear",
    "sandal": "footwear",
    "sandals": "footwear",

    # Accessories
    "accessory": "accessories",
    "accessories": "accessories",
    "bag": "accessories",
    "bags": "accessories",
    "handbag": "accessories",
    "handbags": "accessories",
    "purse": "accessories",
    "wallet": "accessories",
    "belt": "accessories",
    "watch": "accessories",
    "sunglasses": "accessories",

    # Clothing
    "clothing": "clothing",
    "apparel": "clothing",
    "casual wear": "clothing",
    "dress": "clothing",
    "dresses": "clothing",
    "shirt": "clothing",
    "shirts": "clothing",
    "tshirt": "clothing",
    "t-shirt": "clothing",
    "t-shirts": "clothing",
    "jacket": "clothing",
    "jackets": "clothing",
    "coat": "clothing",
    "coats": "clothing",
    "pants": "clothing",
    "trousers": "clothing",
    "jeans": "clothing",
    "short": "clothing",
    "shorts": "clothing",
    "skirt": "clothing",
    "skirts": "clothing",

    # Swimwear
    "swimwear": "swimwear",
    "bikini": "swimwear",
    "swimsuit": "swimwear",
    "beachwear": "swimwear",
}


def safe_text(value) -> str:
    """
    Converts any value into clean text.

    Handles:
    - strings
    - numbers
    - lists
    - dictionaries
    - nested lists/dictionaries
    """
    if value is None:
        return ""

    if isinstance(value, str):
        return value.strip()

    if isinstance(value, (int, float, bool)):
        return str(value)

    if isinstance(value, list):
        cleaned_items = []

        for item in value:
            item_text = safe_text(item)

            if item_text:
                cleaned_items.append(item_text)

        return " ".join(cleaned_items).strip()

    if isinstance(value, dict):
        cleaned_items = []

        for dict_value in value.values():
            item_text = safe_text(dict_value)

            if item_text:
                cleaned_items.append(item_text)

        return " ".join(cleaned_items).strip()

    return str(value).strip()


def normalize_category(value) -> str:
    """
    Converts different category names into one standard category.

    Examples:
    "Sneakers" -> "footwear"
    "Shoes" -> "footwear"
    "Handbag" -> "accessories"
    "Dress" -> "clothing"
    "Shorts" -> "clothing"
    """
    text = safe_text(value).strip().lower()

    if not text:
        return ""

    return CATEGORY_ALIASES.get(text, text)


def get_result_score(result) -> float:
    """
    Works for both Qdrant ScoredPoint objects and dictionary results.
    """
    if isinstance(result, dict):
        return result.get("score", 0)

    return getattr(result, "score", 0)


def get_result_payload(result) -> dict:
    """
    Works for both Qdrant ScoredPoint objects and dictionary results.
    """
    if isinstance(result, dict):
        return result.get("payload", {}) or {}

    return getattr(result, "payload", {}) or {}


def build_match_reason(payload: dict) -> str:
    """
    Builds a short explanation for why this product may have matched.
    """
    reasons = []

    name = payload.get("name")
    category = payload.get("category")
    description = payload.get("description")
    search_text = payload.get("search_text")

    if name:
        reasons.append(f"Name: {name}")

    if category:
        reasons.append(f"Category: {category}")

    if description:
        reasons.append(f"Description: {description}")

    if not reasons and search_text:
        reasons.append(f"Search text: {search_text}")

    if not reasons:
        return "Matched using semantic similarity."

    return " | ".join(reasons)


def normalize_search_result(result) -> dict:
    """
    Converts Qdrant result into a clean frontend-friendly dictionary.
    """
    payload = get_result_payload(result)

    return {
        "score": get_result_score(result),
        "payload": payload,
        "product": payload,
        "match_reason": build_match_reason(payload),
    }


def filter_results_by_score(results, min_score: float):
    """
    Removes weak / irrelevant vector search matches using similarity score.
    """
    return [
        result
        for result in results
        if get_result_score(result) >= min_score
    ]


def filter_results_by_score_and_category(
    results,
    min_score: float,
    category: str | None = None,
):
    """
    Removes weak matches and optionally keeps only products from the detected category.
    """
    filtered = []

    expected_category = normalize_category(category)

    for result in results:
        score = get_result_score(result)
        payload = get_result_payload(result)

        if score < min_score:
            continue

        if expected_category:
            result_category = normalize_category(payload.get("category", ""))

            if result_category != expected_category:
                continue

        filtered.append(result)

    return filtered


def get_analysis_from_vlm_result(vlm_result) -> dict:
    """
    Supports both:
    1. Direct VLM response
    2. Nested response with an 'analysis' key
    """
    if not isinstance(vlm_result, dict):
        return {}

    analysis = vlm_result.get("analysis", vlm_result)

    if not isinstance(analysis, dict):
        return {}

    return analysis


def build_search_text_from_vlm_result(vlm_result) -> str:
    """
    Converts VLM output into clean searchable text for embedding generation.
    """
    analysis = get_analysis_from_vlm_result(vlm_result)

    if not analysis:
        return safe_text(vlm_result)

    fields = [
        "name",
        "brand",
        "product_type",
        "type",
        "category",
        "gender",
        "style",
        "material_guess",
        "description",
        "short_description",
        "colors",
        "visible_features",
        "search_tags",
        "tags",
    ]

    parts = []

    for field in fields:
        value = analysis.get(field)
        text = safe_text(value)

        if text:
            parts.append(text)

    return " ".join(parts).strip()


async def run_image_analysis(file: UploadFile):
    """
    Reads uploaded image file and sends image bytes to the VLM service.
    Supports both sync and async versions of analyze_product_image().
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp"]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WEBP images are allowed",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image file is empty",
        )

    result = analyze_product_image(image_bytes)

    if inspect.isawaitable(result):
        result = await result

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=500,
            detail="VLM did not return a valid dictionary response",
        )

    if "error" in result:
        raise HTTPException(
            status_code=500,
            detail=result,
        )

    return result


@router.get("/search/text")
async def search_by_text(
    query: str = Query(..., description="Customer product search query"),
    limit: int = Query(
        5,
        ge=1,
        le=50,
        description="Number of similar products to return",
    ),
    min_score: float = Query(
        DEFAULT_MIN_SCORE,
        ge=0,
        le=1,
        description="Minimum similarity score",
    ),
    current_user: User = Depends(get_current_user),
):
    clean_query = safe_text(query)

    if not clean_query:
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty",
        )

    expanded_query = expand_query(clean_query)

    query_embedding = generate_embedding(expanded_query)

    results = search_products(
        vector=query_embedding,
        limit=limit,
        user_id=current_user.id,
    )

    filtered_results = filter_results_by_score(
        results=results,
        min_score=min_score,
    )

    normalized_results = [
        normalize_search_result(result)
        for result in filtered_results
    ]

    return {
        "search_type": "text",
        "query": clean_query,
        "expanded_query": expanded_query,
        "user_id": current_user.id,
        "min_score": min_score,
        "count": len(normalized_results),
        "results": normalized_results,
        "message": "Products found" if normalized_results else "No relevant products found",
    }


@router.post("/search/image")
async def search_by_image(
    file: UploadFile = File(...),
    limit: int = Query(
        5,
        ge=1,
        le=50,
        description="Number of similar products to return",
    ),
    min_score: float = Query(
        DEFAULT_MIN_SCORE,
        ge=0,
        le=1,
        description="Minimum similarity score",
    ),
    current_user: User = Depends(get_current_user),
):
    vlm_result = await run_image_analysis(file)

    search_text = build_search_text_from_vlm_result(vlm_result)

    if not search_text:
        raise HTTPException(
            status_code=500,
            detail="VLM analysis did not produce searchable text",
        )

    query_embedding = generate_embedding(search_text)

    search_limit = limit * 3

    results = search_products(
        vector=query_embedding,
        limit=search_limit,
        user_id=current_user.id,
    )

    analysis = get_analysis_from_vlm_result(vlm_result)

    detected_category = (
        analysis.get("category")
        or analysis.get("product_type")
        or analysis.get("type")
    )

    normalized_detected_category = normalize_category(detected_category)

    filtered_results = filter_results_by_score_and_category(
        results=results,
        min_score=min_score,
        category=detected_category,
    )

    filtered_results = filtered_results[:limit]

    normalized_results = [
        normalize_search_result(result)
        for result in filtered_results
    ]

    return {
        "search_type": "image",
        "user_id": current_user.id,
        "vlm_analysis": vlm_result,
        "search_text": search_text,
        "detected_category": detected_category,
        "normalized_detected_category": normalized_detected_category,
        "min_score": min_score,
        "count": len(normalized_results),
        "results": normalized_results,
        "message": "Products found" if normalized_results else "No relevant products found",
    }