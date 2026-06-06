from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from app.config import QDRANT_HOST, QDRANT_PORT, COLLECTION_NAME, VECTOR_SIZE


client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def create_collection_if_not_exists():
    if client.collection_exists(collection_name=COLLECTION_NAME):
        return

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=VECTOR_SIZE,
            distance=Distance.COSINE
        )
    )


def insert_product(product_id: str, vector: list, payload: dict):
    point = PointStruct(
        id=product_id,
        vector=vector,
        payload=payload
    )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[point]
    )


def get_all_products(limit: int = 50):
    points, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        limit=limit,
        with_payload=True,
        with_vectors=False
    )

    return points


def search_products(vector: list, limit: int = 5):
    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=vector,
        limit=limit,
        with_payload=True
    )

    return response.points