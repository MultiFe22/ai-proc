from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import traceback
import logging
from datetime import datetime
from beanie import PydanticObjectId

from app.models.supplier import Supplier, SupplierQuery
from app.ai.web_search import search_suppliers
from app.ai.summarizer import summarize_suppliers
from app.models.search_result import SearchResult

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discovery", tags=["discovery"])

@router.post("/query", response_model=List[Supplier])
async def query_suppliers(query: SupplierQuery):
    """
    Search for suppliers based on component and country using AI.
    The results are saved to the database.
    """
    start_time = datetime.now()
    logger.info(f"Received supplier query request - component: '{query.component}', country: '{query.country}'")
    try:
        # Step 1: Use AI to search for suppliers and save the raw results
        logger.info("Step 1: Starting AI-powered supplier search")
        search_result = await search_suppliers(
            component=query.component, 
            country=query.country
        )
        # Save the search result to MongoDB
        await search_result.create()
        logger.info(f"Saved search result to database with ID: {search_result.id}")
        # Step 2: Process the search result into supplier objects
        supplier = Supplier(
            name=f"Search Results: {query.component} in {query.country}",
            component_type=query.component,
            country=query.country,
            raw_ai_source=f"See search result with ID: {search_result.id}",
            summary=f"This is a reference to search results for {query.component} in {query.country}. Search ID: {search_result.id}"
        )
        await supplier.create()
        logger.info(f"Created placeholder supplier referencing search result")
        return [supplier]
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error processing supplier query: {str(e)}")
        logger.debug(f"Full traceback: {error_traceback}")
        raise HTTPException(status_code=500, detail=f"Error processing supplier query: {str(e)}")

@router.get("/results", response_model=List[Supplier])
async def get_suppliers(
    component: Optional[str] = Query(None, description="Component type to filter by"),
    country: Optional[str] = Query(None, description="Country to filter by")
):
    """
    Retrieve suppliers from the database with optional filtering by component and country.
    """
    logger.info(f"Received request for suppliers - component filter: '{component}', country filter: '{country}'")
    
    # Build query based on provided filters
    query = {}
    if component:
        query["component_type"] = component
    if country:
        query["country"] = country
    
    logger.debug(f"Database query filters: {query}")
    
    try:
        # Fetch suppliers from database
        start_time = datetime.now()
        
        if query:
            logger.debug(f"Executing filtered find query")
            suppliers = await Supplier.find(query).to_list()
        else:
            logger.debug(f"Executing find_all query")
            suppliers = await Supplier.find_all().to_list()
        
        end_time = datetime.now()
        query_duration = (end_time - start_time).total_seconds()
        logger.info(f"Database query completed in {query_duration} seconds, found {len(suppliers)} suppliers")
        
        if not suppliers:
            logger.info("No matching suppliers found")
            return []
        
        return suppliers
        
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error retrieving suppliers: {str(e)}")
        logger.debug(f"Full traceback: {error_traceback}")
        raise HTTPException(status_code=500, detail=f"Error retrieving suppliers: {str(e)}")