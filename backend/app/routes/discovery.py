from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import traceback
import logging
from datetime import datetime
from beanie import PydanticObjectId

from app.models.supplier import Supplier, SupplierQuery
from app.ai.web_search import search_suppliers
from app.ai.summarizer import summarize_suppliers

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
        # Step 1: Use AI to search for suppliers
        logger.info("Step 1: Starting AI-powered supplier search")
        suppliers = await search_suppliers(
            component=query.component, 
            country=query.country
        )
        logger.info(f"AI search completed, found {len(suppliers)} potential suppliers")
        
        # Save raw entries to MongoDB
        logger.debug("Saving raw supplier entries to MongoDB")
        saved_count = 0
        for i, supplier in enumerate(suppliers):
            logger.debug(f"Saving supplier {i+1}/{len(suppliers)}: {supplier.name}")
            try:
                await supplier.create()
                saved_count += 1
            except Exception as db_error:
                logger.error(f"Failed to save supplier '{supplier.name}' to database: {str(db_error)}")
        
        logger.info(f"Successfully saved {saved_count}/{len(suppliers)} suppliers to database")
        
        # Step 2: Generate summaries for the suppliers
        logger.info("Step 2: Generating AI summaries for suppliers")
        try:
            suppliers = await summarize_suppliers(suppliers)
            logger.info(f"Summary generation completed for {len(suppliers)} suppliers")
        except Exception as summary_error:
            logger.error(f"Error during summary generation: {str(summary_error)}")
            logger.debug(f"Will continue with unsummarized suppliers")
        
        # Update the suppliers with summaries
        logger.debug("Updating suppliers with summaries in database")
        update_count = 0
        for i, supplier in enumerate(suppliers):
            try:
                logger.debug(f"Updating supplier {i+1}/{len(suppliers)}: {supplier.name}")
                await supplier.save()
                update_count += 1
            except Exception as update_error:
                logger.error(f"Failed to update supplier '{supplier.name}' with summary: {str(update_error)}")
        
        logger.info(f"Successfully updated {update_count}/{len(suppliers)} suppliers with summaries")
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Supplier discovery completed in {duration} seconds")
        
        return suppliers
        
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