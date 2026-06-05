from fastapi import APIRouter
from app.models.product import Product

router = APIRouter()

fake_products = []

@router.get("/")
def get_products():
    return {
        "count": len(fake_products),
        "products": fake_products
    }

@router.post("/")
def create_product(product: Product):
    fake_products.append(product)
    return {
        "message": "Product created successfully",
        "product": product
    }