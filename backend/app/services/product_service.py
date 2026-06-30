from uuid import uuid4
from typing import Any

from app.models.product import Product
from app.utils.embeddings import generate_embedding
from app.services.qdrant_service import (
    insert_product,
    get_all_products,
    search_products,
)


MIN_SEARCH_SCORE = 0.40


QUERY_EXPANSIONS = {
    "shoe": "shoes sneakers footwear trainers running shoes athletic shoes sports shoes",
    "shoes": "shoes sneakers footwear trainers running shoes athletic shoes sports shoes",
    "sneaker": "sneakers shoes footwear trainers running shoes athletic shoes sports shoes",
    "sneakers": "sneakers shoes footwear trainers running shoes athletic shoes sports shoes",
    "trainer": "trainers shoes sneakers footwear running shoes sports shoes",
    "trainers": "trainers shoes sneakers footwear running shoes sports shoes",

    "short": "shorts denim shorts casual shorts summer wear clothing fashion",
    "shorts": "shorts denim shorts casual shorts summer wear clothing fashion",

    "bag": "bag handbag purse shoulder bag tote bag leather bag accessories fashion",
    "handbag": "handbag bag purse shoulder bag leather bag accessories fashion",
    "purse": "purse handbag bag shoulder bag accessories fashion",
    "tote": "tote bag handbag shoulder bag accessories fashion",

    "dress": "dress gown outfit clothing fashion formal dress party dress",
    "gown": "gown dress formal dress party dress clothing fashion",

    "shirt": "shirt top clothing fashion casual wear",
    "top": "top shirt blouse clothing fashion casual wear",
    "blouse": "blouse top shirt clothing fashion",

    "bikini": "bikini swimwear swimsuit beachwear summer wear",
    "swimsuit": "swimsuit bikini swimwear beachwear summer wear",
    "swimwear": "swimwear bikini swimsuit beachwear summer wear",

    "jacket": "jacket coat outerwear clothing fashion winter wear",
    "coat": "coat jacket outerwear clothing fashion winter wear",
}


def safe_text(value: Any) -> str:
    """
    Convert any value into clean searchable text.

    Handles:
    - None
    - strings
    - numbers
    - lists
    - dictionaries
    - nested structures
    """
    if value is None:
        return ""

    if isinstance(value, str):
        return value.strip()

    if isinstance(value, (int, float, bool)):
        return str(value)

    if isinstance(value, list):
        return " ".join(
            safe_text(item) for item in value if item is not None
        ).strip()

    if isinstance(value, dict):
        return " ".join(
            safe_text(item) for item in value.values() if item is not None
        ).strip()

    return str(value).strip()


def expand_query(query: str) -> str:
    """
    Expand user query with related product terms.

    Example:
    "shoes" becomes:
    "shoes sneakers footwear trainers running shoes athletic shoes sports shoes"
    """
    clean_query = safe_text(query).lower()

    if not clean_query:
        return ""

    expanded_terms = [clean_query]

    for keyword, expansion in QUERY_EXPANSIONS.items():
        if keyword in clean_query:
            expanded_terms.append(expansion)

    return " ".join(expanded_terms).strip()


def build_product_search_text(product: Product) -> str:
    """
    Build richer text for product embedding.

    This text is converted into an embedding and stored in Qdrant.
    Better text means better semantic search.
    """
    parts = [
        getattr(product, "name", ""),
        getattr(product, "category", ""),
        getattr(product, "description", ""),
    ]

    return " ".join(
        safe_text(part) for part in parts if part is not None
    ).strip()


def build_product_payload(product: Product, product_id: str) -> dict:
    """
    Build clean Qdrant payload for one product.

    Important:
    user_id must be saved in Qdrant payload so search can be user-specific.
    """
    return {
        "product_id": product_id,
        "name": getattr(product, "name", None),
        "description": getattr(product, "description", None),
        "category": getattr(product, "category", None),
        "price": getattr(product, "price", None),
        "image_url": getattr(product, "image_url", None),
        "user_id": getattr(product, "user_id", None),
        "postgres_id": getattr(product, "id", None),
    }


def build_match_reason(payload: dict) -> str:
    """
    Build a simple human-readable explanation for why the product may match.
    """
    reasons = []

    name = payload.get("name")
    category = payload.get("category")
    description = payload.get("description")

    if name:
        reasons.append(f"Name: {name}")

    if category:
        reasons.append(f"Category: {category}")

    if description:
        reasons.append(f"Description: {description}")

    if not reasons:
        return "Matched using semantic similarity."

    return " | ".join(reasons)


def normalize_search_result(result) -> dict:
    """
    Convert one Qdrant result into a clean API response.
    """
    payload = result.payload or {}

    return {
        "score": result.score,
        "product": payload,
        "payload": payload,
        "match_reason": build_match_reason(payload),
    }


def filter_results_by_score(results, min_score: float = MIN_SEARCH_SCORE):
    """
    Remove weak Qdrant matches.
    """
    return [result for result in results if result.score >= min_score]


def create_product_service(product: Product):
    """
    Create product vector in Qdrant.

    Note:
    This service creates the Qdrant entry.
    PostgreSQL saving is handled separately in API/database logic.
    """
    product_id = str(uuid4())

    searchable_text = build_product_search_text(product)
    vector = generate_embedding(searchable_text)

    payload = build_product_payload(product, product_id)
    payload["search_text"] = searchable_text

    insert_product(
        product_id=product_id,
        vector=vector,
        payload=payload,
    )

    return {
        "message": "Product created successfully",
        "product": payload,
    }


def get_products_service(user_id: int | None = None):
    """
    Get products stored in Qdrant.

    If user_id is provided, only that user's Qdrant products are returned.
    """
    points = get_all_products(user_id=user_id)

    return {
        "user_id": user_id,
        "count": len(points),
        "products": [point.payload for point in points],
    }


def search_products_service(
    query: str,
    limit: int = 5,
    user_id: int | None = None,
    min_score: float = MIN_SEARCH_SCORE,
):
    """
    Search products using expanded query + embedding + user-specific Qdrant filter.

    Steps:
    1. Clean user query
    2. Expand query with related terms
    3. Generate embedding
    4. Search Qdrant only for current user's products
    5. Remove weak results
    6. Return clean response
    """
    clean_query = safe_text(query)

    if not clean_query:
        return {
            "query": query,
            "expanded_query": "",
            "user_id": user_id,
            "min_score": min_score,
            "count": 0,
            "results": [],
            "message": "Empty search query.",
        }

    expanded_query = expand_query(clean_query)
    vector = generate_embedding(expanded_query)

    raw_results = search_products(
        vector=vector,
        limit=limit,
        user_id=user_id,
    )

    filtered_results = filter_results_by_score(
        raw_results,
        min_score=min_score,
    )

    return {
        "query": clean_query,
        "expanded_query": expanded_query,
        "user_id": user_id,
        "min_score": min_score,
        "count": len(filtered_results),
        "results": [
            normalize_search_result(result)
            for result in filtered_results
        ],
    }