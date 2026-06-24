from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.config import QDRANT_HOST, QDRANT_PORT, COLLECTION_NAME, VECTOR_SIZE


client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def create_collection_if_not_exists():
    if client.collection_exists(collection_name=COLLECTION_NAME):
        return

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=VECTOR_SIZE,
            distance=Distance.COSINE,
        ),
    )


def build_user_filter(user_id: int | None = None):
    """
    Creates a Qdrant filter for user-specific search.

    If user_id is provided:
    - Qdrant returns only points where payload.user_id == user_id

    If user_id is None:
    - No filter is applied
    """
    if user_id is None:
        return None

    return Filter(
        must=[
            FieldCondition(
                key="user_id",
                match=MatchValue(value=user_id),
            )
        ]
    )


def insert_product(product_id: str, vector: list, payload: dict):
    """
    Inserts or updates a product vector in Qdrant.

    Important:
    payload should include user_id if this product belongs to a logged-in user.

    Example payload:
    {
        "user_id": 12,
        "product_id": 5,
        "name": "Brown Saddle Bag Handbag",
        "category": "Accessories",
        "description": "..."
    }
    """
    create_collection_if_not_exists()

    point = PointStruct(
        id=product_id,
        vector=vector,
        payload=payload,
    )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[point],
    )


def get_all_products(limit: int = 50, user_id: int | None = None):
    """
    Gets products from Qdrant.

    If user_id is given, only that user's products are returned.
    """
    create_collection_if_not_exists()

    points, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        limit=limit,
        scroll_filter=build_user_filter(user_id),
        with_payload=True,
        with_vectors=False,
    )

    return points


def search_products(vector: list, limit: int = 5, user_id: int | None = None):
    """
    Searches products in Qdrant.

    If user_id is given, search is limited to that user's products only.
    """
    create_collection_if_not_exists()

    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=vector,
        query_filter=build_user_filter(user_id),
        limit=limit,
        with_payload=True,
    )

    return response.points