import inspect

from fastapi import APIRouter, UploadFile, File, Query, HTTPException

from app.services.vlm_service import analyze_product_image
from app.utils.embeddings import generate_embedding
from app.services.qdrant_service import search_products


router = APIRouter(prefix="/multimodal", tags=["Multimodal Search"])


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


def filter_results_by_score(results, min_score: float):
    """
    Remove weak / irrelevant vector search matches using only similarity score.
    Used mainly for text search.
    """
    return [
        result for result in results
        if get_result_score(result) >= min_score
    ]


def filter_results_by_score_and_category(
    results,
    min_score: float,
    category: str | None = None,
):
    """
    Remove weak matches and optionally keep only products from the detected category.
    Used mainly for image search because VLM gives structured category info.
    """
    filtered = []

    for result in results:
        score = get_result_score(result)
        payload = get_result_payload(result)

        if score < min_score:
            continue

        if category:
            result_category = str(payload.get("category", "")).strip().lower()
            expected_category = category.strip().lower()

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
    Converts VLM output into searchable text for embedding generation.
    """

    analysis = get_analysis_from_vlm_result(vlm_result)

    if not analysis:
        return str(vlm_result)

    parts = []

    simple_fields = [
        "name",
        "product_type",
        "category",
        "gender",
        "style",
        "material_guess",
        "description",
        "short_description",
    ]

    for field in simple_fields:
        value = analysis.get(field)
        if value:
            parts.append(str(value))

    list_fields = [
        "colors",
        "visible_features",
        "search_tags",
        "tags",
    ]

    for field in list_fields:
        value = analysis.get(field)

        if isinstance(value, list):
            parts.extend([str(item) for item in value])
        elif value:
            parts.append(str(value))

    return " ".join(parts)


async def run_image_analysis(file: UploadFile):
    """
    Reads uploaded image file and sends image bytes to the VLM service.
    Supports both sync and async versions of analyze_product_image().
    """

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty")

    result = analyze_product_image(image_bytes)

    if inspect.isawaitable(result):
        result = await result

    return result


@router.get("/search/text")
async def search_by_text(
    query: str = Query(..., description="Customer product search query"),
    limit: int = Query(5, description="Number of similar products to return"),
    min_score: float = Query(0.30, description="Minimum similarity score"),
):
    query_embedding = generate_embedding(query)

    results = search_products(query_embedding, limit)

    filtered_results = filter_results_by_score(results, min_score)

    return {
        "search_type": "text",
        "query": query,
        "min_score": min_score,
        "results": filtered_results,
        "message": "Products found" if filtered_results else "No relevant products found",
    }


@router.post("/search/image")
async def search_by_image(
    file: UploadFile = File(...),
    limit: int = Query(5, description="Number of similar products to return"),
    min_score: float = Query(0.30, description="Minimum similarity score"),
):
    vlm_result = await run_image_analysis(file)

    search_text = build_search_text_from_vlm_result(vlm_result)

    if not search_text.strip():
        raise HTTPException(
            status_code=500,
            detail="VLM analysis did not produce searchable text",
        )

    query_embedding = generate_embedding(search_text)

    results = search_products(query_embedding, limit)

    analysis = get_analysis_from_vlm_result(vlm_result)
    detected_category = analysis.get("category")

    filtered_results = filter_results_by_score_and_category(
        results=results,
        min_score=min_score,
        category=detected_category,
    )

    return {
        "search_type": "image",
        "vlm_analysis": vlm_result,
        "search_text": search_text,
        "detected_category": detected_category,
        "min_score": min_score,
        "results": filtered_results,
        "message": "Products found" if filtered_results else "No relevant products found",
    }