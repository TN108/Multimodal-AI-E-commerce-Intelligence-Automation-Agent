from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.product import Product, ProductSearch
from app.services.product_service import (
    create_product_service,
    get_products_service,
    search_products_service,
)
from app.services.vlm_service import analyze_product_image


router = APIRouter()


def safe_join(value) -> str:
    """
    Safely converts strings, lists, dictionaries, and mixed VLM outputs into clean text.

    This prevents crashes when the VLM returns:
    ["Collar", "Buttons"]

    or:
    [{"feature": "Collar"}, {"feature": "Buttons"}]
    """
    if value is None:
        return ""

    if isinstance(value, list):
        cleaned_items = []

        for item in value:
            if item is None:
                continue

            if isinstance(item, str):
                cleaned_items.append(item)

            elif isinstance(item, dict):
                if len(item) == 1:
                    cleaned_items.append(str(next(iter(item.values()))))
                else:
                    cleaned_items.append(" ".join(str(v) for v in item.values()))

            else:
                cleaned_items.append(str(item))

        return ", ".join(cleaned_items)

    if isinstance(value, dict):
        return ", ".join(str(v) for v in value.values())

    return str(value)


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
        limit=product_search.limit,
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

    product_type = str(analysis.get("product_type", "Unknown Product"))
    category = str(analysis.get("category", "Uncategorized"))
    gender = str(analysis.get("gender", ""))
    style = str(analysis.get("style", ""))
    material_guess = str(analysis.get("material_guess", ""))
    short_description = str(analysis.get("short_description", ""))

    colors = analysis.get("colors", [])
    visible_features = analysis.get("visible_features", [])
    search_tags = analysis.get("search_tags", [])

    color_text = safe_join(colors)
    feature_text = safe_join(visible_features)
    tag_text = safe_join(search_tags)

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