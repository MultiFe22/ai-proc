from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class SearchResult(Document):
    """
    Model for storing raw search results from AI procurement searches before processing into suppliers.
    """
    query_component: str = Field(..., description="Component type that was searched for")
    query_country: str = Field(..., description="Country that was searched in")
    raw_ai_response: str = Field(..., description="Raw AI response in JSON format")
    search_date: datetime = Field(default_factory=datetime.now)
    is_processed: bool = Field(default=False, description="Whether this search has been processed into suppliers")

    class Settings:
        name = "search_results"