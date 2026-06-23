from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    image_url: Optional[str] = Field(default=None, max_length=500)
    qdrant_point_id: Optional[str] = Field(default=None, max_length=255)


class ProductSearch(BaseModel):
    query: str


class ProductResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    qdrant_point_id: Optional[str]
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True