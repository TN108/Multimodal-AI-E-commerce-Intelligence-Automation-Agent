from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.vlm_service import analyze_product_image


router = APIRouter()


@router.post("/analyze-product-image")
async def analyze_product_image_api(file: UploadFile = File(...)):
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

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "analysis": analysis,
    }