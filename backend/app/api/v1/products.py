from fastapi import APIRouter

from app.models.product import Product, ProductSearch
from app.services.product_service import (
    create_product_service,
    get_products_service,
    search_products_service
)


router = APIRouter()


@router.get("/")
def get_products():
    return get_products_service()


@router.post("/")
def create_product(product: Product):
    return create_product_service(product)


@router.post("/search")
def search_products(product_search: ProductSearch):
    return search_products_service(
        query=product_search.query,
        limit=product_search.limit
    )