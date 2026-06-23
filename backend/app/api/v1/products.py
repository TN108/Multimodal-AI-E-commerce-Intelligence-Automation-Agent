from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import (
    ProductCreateRequest,
    ProductResponse,
    ProductSearch,
)
from app.services.product_service import search_products_service
from app.services.vlm_service import analyze_product_image
from app.utils.auth_dependencies import get_current_user


router = APIRouter()


def safe_join(value) -> str:
    """
    Safely converts strings, lists, dictionaries, and mixed VLM outputs into clean text.
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


@router.get(
    "/",
    response_model=list[ProductResponse],
)
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products = (
        db.query(Product)
        .filter(Product.user_id == current_user.id)
        .order_by(Product.id.desc())
        .all()
    )

    return products


@router.post(
    "/",
    response_model=ProductResponse,
)
def create_product(
    product: ProductCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_product = Product(
        name=product.name.strip(),
        category=product.category,
        description=product.description,
        image_url=product.image_url,
        qdrant_point_id=product.qdrant_point_id,
        user_id=current_user.id,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.post("/search")
def search_products(product_search: ProductSearch):
    return search_products_service(
        query=product_search.query,
        limit=product_search.limit,
    )


@router.post("/analyze-and-save")
async def analyze_and_save_product(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    new_product = Product(
        name=product_name,
        description=description,
        category=category,
        image_url=None,
        qdrant_point_id=None,
        user_id=current_user.id,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product analyzed and saved successfully",
        "filename": file.filename,
        "content_type": file.content_type,
        "vlm_analysis": analysis,
        "saved_product": {
            "id": new_product.id,
            "name": new_product.name,
            "category": new_product.category,
            "description": new_product.description,
            "image_url": new_product.image_url,
            "qdrant_point_id": new_product.qdrant_point_id,
            "user_id": new_product.user_id,
            "created_at": new_product.created_at,
        },
    }