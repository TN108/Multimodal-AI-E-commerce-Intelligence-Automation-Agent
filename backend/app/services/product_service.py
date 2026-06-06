from uuid import uuid4

from app.models.product import Product
from app.utils.embeddings import generate_embedding
from app.services.qdrant_service import (
    insert_product,
    get_all_products,
    search_products
)


def create_product_service(product: Product):
    product_id = str(uuid4())

    searchable_text = f"{product.name} {product.description or ''} {product.category or ''}"
    vector = generate_embedding(searchable_text)

    payload = {
        "product_id": product_id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "category": product.category
    }

    insert_product(
        product_id=product_id,
        vector=vector,
        payload=payload
    )

    return {
        "message": "Product created successfully",
        "product": payload
    }


def get_products_service():
    points = get_all_products()

    return {
        "count": len(points),
        "products": [point.payload for point in points]
    }


def search_products_service(query: str, limit: int):
    vector = generate_embedding(query)
    results = search_products(vector=vector, limit=limit)

    return {
        "query": query,
        "count": len(results),
        "results": [
            {
                "score": result.score,
                "product": result.payload
            }
            for result in results
        ]
    }