from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.product import Product, ProductSearch
from app.services.product_service import (
    create_product_service,
    get_products_service,
    search_products_service
)
from app.services.vlm_service import analyze_product_image


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


@router.post("/analyze-and-save")
async def analyze_and_save_product(file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp"]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WEBP images are allowed",
        )

    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    analysis = await analyze_product_image(image_bytes)

    if "error" in analysis:
        raise HTTPException(
            status_code=500,
            detail=analysis,
        )

    product_type = analysis.get("product_type", "Unknown Product")
    category = analysis.get("category", "Uncategorized")
    gender = analysis.get("gender", "")
    colors = analysis.get("colors", [])
    style = analysis.get("style", "")
    material_guess = analysis.get("material_guess", "")
    visible_features = analysis.get("visible_features", [])
    search_tags = analysis.get("search_tags", [])
    short_description = analysis.get("short_description", "")

    color_text = ", ".join(colors) if isinstance(colors, list) else str(colors)
    feature_text = ", ".join(visible_features) if isinstance(visible_features, list) else str(visible_features)
    tag_text = ", ".join(search_tags) if isinstance(search_tags, list) else str(search_tags)

    name_parts = [gender, color_text, style, product_type]
    product_name = " ".join([part for part in name_parts if part]).strip()

    if not product_name:
        product_name = product_type

    description = (
        f"{short_description} "
        f"Material guess: {material_guess}. "
        f"Visible features: {feature_text}. "
        f"Search tags: {tag_text}."
    ).strip()

    product = Product(
        name=product_name,
        description=description,
        price=0.0,
        category=category,
    )

    saved_product = create_product_service(product)

    return {
        "message": "Product analyzed and saved successfully",
        "filename": file.filename,
        "content_type": file.content_type,
        "vlm_analysis": analysis,
        "saved_product": saved_product,
    }