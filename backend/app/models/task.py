from enum import Enum
from datetime import datetime
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field

class TaskStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class SupplierTask(Document):
    component: str
    country: str
    status: TaskStatus = Field(default=TaskStatus.QUEUED)
    message: Optional[str] = None
    search_result_id: Optional[PydanticObjectId] = None
    supplier_count: Optional[int] = None
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    
    class Settings:
        name = "supplier_tasks"