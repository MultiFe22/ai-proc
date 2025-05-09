from datetime import datetime
from typing import List, Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class Supplier(Document):
    name: str
    website: Optional[str] = None
    location: Optional[str] = None
    product: Optional[str] = None
    component_type: str
    country: str
    lead_time_days: Optional[int] = None
    min_order_qty: Optional[int] = None
    certifications: Optional[List[str]] = Field(default_factory=list)
    summary: Optional[str] = None
    raw_ai_source: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "suppliers"
        

class SupplierQuery(BaseModel):
    component: str
    country: str