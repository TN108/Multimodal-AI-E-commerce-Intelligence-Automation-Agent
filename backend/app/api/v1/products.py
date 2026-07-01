import inspect
import re

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import (
    ProductCreateRequest,
    ProductResponse,
    ProductSearch,
    ProductUpdate,
)
from app.services.product_service import search_products_service
from app.services.vlm_service import analyze_product_image
from app.services.qdrant_service import insert_product, delete_product_from_qdrant
from app.utils.auth_dependencies import get_current_user
from app.utils.embeddings import generate_embedding


router = APIRouter()


UNSUPPORTED_PRODUCT_MESSAGE = (
    "We do not currently support this type of product. "
    "Please upload a fashion-related product such as clothing, shoes, "
    "jewelry, bags, or accessories."
)


DUPLICATE_PRODUCT_MESSAGE = (
    "This product already exists in your catalog. It was not saved again."
)


SUPPORTED_SPECIFIC_PRODUCT_KEYWORDS = {
    # Footwear
    "shoe",
    "shoes",
    "sneaker",
    "sneakers",
    "footwear",
    "trainer",
    "trainers",
    "boot",
    "boots",
    "sandal",
    "sandals",
    "heel",
    "heels",

    # Bags and accessories
    "bag",
    "bags",
    "handbag",
    "handbags",
    "purse",
    "wallet",
    "belt",
    "watch",
    "sunglasses",
    "accessory",
    "accessories",
    "crossbody",
    "shoulder bag",
    "saddle bag",
    "satchel",
    "clutch",
    "tote",
    "tote bag",
    "strap",
    "buckle",
    "leather",

    # Jewelry / jewellery
    "jewelry",
    "jewellery",
    "necklace",
    "earring",
    "earrings",
    "bracelet",
    "ring",
    "rings",

    # Clothing items
    "dress",
    "dresses",
    "shirt",
    "shirts",
    "tshirt",
    "t-shirt",
    "t-shirts",
    "top",
    "tops",
    "blouse",
    "jacket",
    "jackets",
    "coat",
    "coats",
    "hoodie",
    "sweater",
    "pants",
    "trousers",
    "jeans",
    "short",
    "shorts",
    "skirt",
    "skirts",
    "bikini",
    "swimwear",
    "swimsuit",

    # South Asian fashion
    "kurta",
    "shalwar",
    "kameez",
    "saree",
    "sari",
    "dupatta",
    "lehenga",
}


UNSUPPORTED_PRODUCT_KEYWORDS = {
    # Food / fruit
    "fruit",
    "food",
    "strawberry",
    "apple",
    "banana",
    "orange",
    "mango",
    "vegetable",
    "drink",
    "beverage",

    # Animals
    "animal",
    "dog",
    "cat",
    "bird",
    "horse",
    "cow",
    "goat",

    # Vehicles
    "vehicle",
    "car",
    "bike",
    "bicycle",
    "motorcycle",
    "truck",
    "bus",

    # Electronics
    "phone",
    "mobile",
    "laptop",
    "computer",
    "keyboard",
    "mouse",
    "electronics",
    "camera",

    # Other unsupported objects
    "furniture",
    "chair",
    "table",
    "sofa",
    "plant",
    "tree",
    "flower",
    "building",
    "room",
}


def get_user_product_or_404(product_id: int, db: Session, current_user: User):
    """
    Finds a product by ID and checks whether it belongs to the logged-in user.

    Rules:
    - If product does not exist, return 404.
    - If product belongs to another user, return 403.
    - If product belongs to current user, return product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if product.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this product",
        )

    return product


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


def get_clean_analysis(analysis: dict) -> dict:
    """
    Supports both direct VLM responses and nested VLM responses.

    Direct:
    {
        "product_type": "Handbag",
        "category": "Accessories"
    }

    Nested:
    {
        "analysis": {
            "product_type": "Handbag",
            "category": "Accessories"
        }
    }
    """
    if not isinstance(analysis, dict):
        return {}

    nested_analysis = analysis.get("analysis")

    if isinstance(nested_analysis, dict):
        return nested_analysis

    return analysis


def keyword_exists(text: str, keyword: str) -> bool:
    """
    Checks keywords safely.

    Single-word keywords match as full words only.
    Example:
    - "car" matches "car"
    - "car" does not match "carrying"

    Multi-word keywords match as phrases.
    Example:
    - "shoulder bag" matches "brown shoulder bag"
    """
    clean_text = str(text or "").lower()
    clean_keyword = str(keyword or "").lower().strip()

    if not clean_keyword:
        return False

    if " " in clean_keyword:
        return clean_keyword in clean_text

    pattern = rf"\b{re.escape(clean_keyword)}\b"

    return re.search(pattern, clean_text) is not None


def has_any_keyword(text: str, keywords: set[str]) -> bool:
    """
    Returns True if any keyword exists safely in the text.
    """
    return any(keyword_exists(text, keyword) for keyword in keywords)


def validate_supported_product(analysis: dict):
    """
    Rejects unsupported uploads before saving to PostgreSQL or Qdrant.

    Supported:
    - clothing items
    - shoes / footwear
    - bags
    - jewelry / jewellery
    - fashion accessories

    Unsupported:
    - fruit / food
    - animals
    - vehicles
    - electronics
    - furniture
    - random objects
    """
    clean_analysis = get_clean_analysis(analysis)

    if not clean_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UNSUPPORTED_PRODUCT_MESSAGE,
        )

    explicit_supported_flag = clean_analysis.get("is_supported_product")
    explicit_fashion_flag = clean_analysis.get("is_fashion_product")

    if explicit_supported_flag is False or explicit_fashion_flag is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UNSUPPORTED_PRODUCT_MESSAGE,
        )

    product_type = safe_join(clean_analysis.get("product_type", "")).lower()
    category = safe_join(clean_analysis.get("category", "")).lower()
    gender = safe_join(clean_analysis.get("gender", "")).lower()
    style = safe_join(clean_analysis.get("style", "")).lower()
    material_guess = safe_join(clean_analysis.get("material_guess", "")).lower()
    colors = safe_join(clean_analysis.get("colors", "")).lower()
    visible_features = safe_join(clean_analysis.get("visible_features", "")).lower()
    search_tags = safe_join(clean_analysis.get("search_tags", "")).lower()
    short_description = safe_join(clean_analysis.get("short_description", "")).lower()
    description = safe_join(clean_analysis.get("description", "")).lower()

    combined_text = " ".join(
        [
            product_type,
            category,
            gender,
            style,
            material_guess,
            colors,
            visible_features,
            search_tags,
            short_description,
            description,
        ]
    ).lower()

    has_supported_product_keyword = has_any_keyword(
        combined_text,
        SUPPORTED_SPECIFIC_PRODUCT_KEYWORDS,
    )

    has_unsupported_product_keyword = has_any_keyword(
        combined_text,
        UNSUPPORTED_PRODUCT_KEYWORDS,
    )

    if has_unsupported_product_keyword and not has_supported_product_keyword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UNSUPPORTED_PRODUCT_MESSAGE,
        )

    if has_supported_product_keyword:
        return

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=UNSUPPORTED_PRODUCT_MESSAGE,
    )


def normalize_duplicate_text(value: str) -> str:
    """
    Normalizes text so duplicate comparison is more stable.

    Example:
    "Brown   Saddle-Bag!!!"
    becomes:
    "brown saddle bag"
    """
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def build_duplicate_signature(name: str, category: str, description: str) -> str:
    """
    Builds a simplified product signature for duplicate detection.
    """
    return normalize_duplicate_text(
        f"{name} {category} {description}"
    )


def find_duplicate_product(
    db: Session,
    current_user: User,
    product_name: str,
    category: str,
    description: str,
):
    """
    Checks if the logged-in user already has a very similar product.

    This prevents saving the same product multiple times for the same user.
    """
    new_signature = build_duplicate_signature(
        product_name,
        category,
        description,
    )

    existing_products = (
        db.query(Product)
        .filter(Product.user_id == current_user.id)
        .all()
    )

    for existing_product in existing_products:
        existing_signature = build_duplicate_signature(
            existing_product.name,
            existing_product.category,
            existing_product.description,
        )

        if existing_signature == new_signature:
            return existing_product

    return None


def raise_duplicate_product_error():
    """
    Raises a consistent duplicate product error.
    """
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=DUPLICATE_PRODUCT_MESSAGE,
    )


def normalize_qdrant_point_id(point_id):
    """
    Qdrant point IDs may be integers or UUID strings.

    In this project, we insert product vectors using the PostgreSQL product ID.
    That ID is an integer, but qdrant_point_id is stored in PostgreSQL as a string.
    So before deleting/updating Qdrant, convert numeric strings back to int.
    """
    if point_id is None:
        return None

    point_id = str(point_id)

    if point_id.isdigit():
        return int(point_id)

    return point_id


def build_search_text_from_product(product: Product) -> str:
    """
    Builds searchable text from the current PostgreSQL product data.

    Used when syncing updated product data back into Qdrant.
    """
    parts = [
        product.name,
        product.category,
        product.description,
    ]

    return " ".join(str(part) for part in parts if part).strip()


def sync_product_to_qdrant(product: Product):
    """
    Inserts or updates the product vector in Qdrant.

    This keeps Qdrant synchronized with PostgreSQL after product updates.
    """
    search_text = build_search_text_from_product(product)

    if not search_text:
        return

    embedding = generate_embedding(search_text)

    qdrant_point_id = product.qdrant_point_id or str(product.id)
    normalized_point_id = normalize_qdrant_point_id(qdrant_point_id)

    payload = {
        "user_id": product.user_id,
        "product_id": product.id,
        "name": product.name,
        "category": product.category,
        "description": product.description,
        "image_url": product.image_url,
        "search_text": search_text,
    }

    insert_product(
        product_id=normalized_point_id,
        vector=embedding,
        payload=payload,
    )

    product.qdrant_point_id = str(qdrant_point_id)


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
    product_name = product.name.strip()
    category = product.category or ""
    description = product.description or ""

    duplicate_product = find_duplicate_product(
        db=db,
        current_user=current_user,
        product_name=product_name,
        category=category,
        description=description,
    )

    if duplicate_product:
        raise_duplicate_product_error()

    new_product = Product(
        name=product_name,
        category=product.category,
        description=product.description,
        image_url=product.image_url,
        qdrant_point_id=None,
        user_id=current_user.id,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    sync_product_to_qdrant(new_product)

    db.commit()
    db.refresh(new_product)

    return new_product


@router.post("/search")
def search_products(
    product_search: ProductSearch,
    current_user: User = Depends(get_current_user),
):
    return search_products_service(
        query=product_search.query,
        limit=product_search.limit,
        user_id=current_user.id,
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WEBP images are allowed",
        )

    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    analysis = analyze_product_image(image_bytes)

    if inspect.isawaitable(analysis):
        analysis = await analysis

    if not isinstance(analysis, dict):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="VLM did not return a valid dictionary response",
        )

    if "error" in analysis:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=analysis,
        )

    analysis_data = get_clean_analysis(analysis)

    validate_supported_product(analysis_data)

    product_type = str(analysis_data.get("product_type", "Unknown Product"))
    category = str(analysis_data.get("category", "Uncategorized"))
    gender = str(analysis_data.get("gender", ""))
    style = str(analysis_data.get("style", ""))
    material_guess = str(analysis_data.get("material_guess", ""))
    short_description = str(analysis_data.get("short_description", ""))

    colors = analysis_data.get("colors", [])
    visible_features = analysis_data.get("visible_features", [])
    search_tags = analysis_data.get("search_tags", [])

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

    search_text = " ".join(
        [
            product_name,
            category,
            gender,
            style,
            material_guess,
            color_text,
            feature_text,
            tag_text,
            short_description,
            description,
        ]
    ).strip()

    duplicate_product = find_duplicate_product(
        db=db,
        current_user=current_user,
        product_name=product_name,
        category=category,
        description=description,
    )

    if duplicate_product:
        raise_duplicate_product_error()

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

    embedding = generate_embedding(search_text)

    qdrant_point_id = new_product.id

    qdrant_payload = {
        "user_id": current_user.id,
        "product_id": new_product.id,
        "name": new_product.name,
        "category": new_product.category,
        "description": new_product.description,
        "search_text": search_text,
        "product_type": product_type,
        "gender": gender,
        "style": style,
        "material_guess": material_guess,
        "colors": colors,
        "visible_features": visible_features,
        "search_tags": search_tags,
    }

    insert_product(
        product_id=qdrant_point_id,
        vector=embedding,
        payload=qdrant_payload,
    )

    new_product.qdrant_point_id = str(qdrant_point_id)

    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product analyzed and saved successfully",
        "filename": file.filename,
        "content_type": file.content_type,
        "vlm_analysis": analysis_data,
        "search_text": search_text,
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


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = get_user_product_or_404(product_id, db, current_user)
    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = get_user_product_or_404(product_id, db, current_user)

    update_data = product_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided",
        )

    for key, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()

        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    sync_product_to_qdrant(product)

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = get_user_product_or_404(product_id, db, current_user)

    if product.qdrant_point_id:
        qdrant_point_id = normalize_qdrant_point_id(product.qdrant_point_id)
        delete_product_from_qdrant(qdrant_point_id)

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully",
        "product_id": product_id,
    }