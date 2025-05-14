from fastapi import APIRouter, HTTPException, Query, Depends, Path
from typing import List, Optional
import traceback
import logging
from datetime import datetime
from beanie import PydanticObjectId

from app.models.supplier import Supplier, SupplierQuery
from app.models.search_result import SearchResult
from app.models.task import SupplierTask, TaskStatus
from app.ai.web_search import search_suppliers
from app.ai.summarizer import process_search_result
from app.worker import process_supplier_query  # Import Celery task

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
        
        # Step 2: Process the search result into structured supplier objects
        logger.info("Step 2: Processing search results into structured supplier data")
        from app.ai.summarizer import process_search_result
        suppliers = await process_search_result(search_result)
        
        # Step 3: Save the structured suppliers to the database
        logger.debug(f"Saving {len(suppliers)} extracted suppliers to database")
        saved_count = 0
        for i, supplier in enumerate(suppliers):
            try:
                logger.debug(f"Saving supplier {i+1}/{len(suppliers)}: {supplier.name}")
                await supplier.create()
                saved_count += 1
            except Exception as save_error:
                logger.error(f"Failed to save supplier '{supplier.name}' to database: {str(save_error)}")
        
        logger.info(f"Successfully saved {saved_count}/{len(suppliers)} suppliers to database")
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Supplier discovery and processing completed in {duration} seconds")
        
        return suppliers
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error processing supplier query: {str(e)}")
        logger.debug(f"Full traceback: {error_traceback}")
        raise HTTPException(status_code=500, detail=f"Error processing supplier query: {str(e)}")

@router.post("/query/async", response_model=SupplierTask)
async def async_query_suppliers(query: SupplierQuery):
    """
    Asynchronously search for suppliers based on component and country using AI.
    Returns a task that can be used to check status and retrieve results when ready.
    """
    logger.info(f"Received async supplier query - component: '{query.component}', country: '{query.country}'")
    
    # Create and save a new task
    task = SupplierTask(
        component=query.component,
        country=query.country,
        status=TaskStatus.QUEUED,
        message="Task queued, waiting to start processing"
    )
    await task.create()
    
    # Start the Celery task
    process_supplier_query.delay(
        str(task.id),
        query.component, 
        query.country
    )
    
    logger.info(f"Created task {task.id} for async supplier query and dispatched to Celery")
    return task

@router.get("/tasks/{task_id}", response_model=SupplierTask)
async def get_task_status(task_id: str):
    """
    Check the status of an asynchronous supplier query task.
    """
    try:
        task_object_id = PydanticObjectId(task_id)
        task = await SupplierTask.get(task_object_id)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        return task
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid task ID format: {task_id}")
    except Exception as e:
        logger.error(f"Error retrieving task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving task: {str(e)}")

@router.get("/tasks/{task_id}/results", response_model=List[Supplier])
async def get_task_results(task_id: str):
    """
    Get the results of a completed supplier query task.
    """
    try:
        # Convert task_id to PydanticObjectId
        task_object_id = PydanticObjectId(task_id)
        
        # Find the task by ID
        task = await SupplierTask.get(task_object_id)
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
            
        if task.status != TaskStatus.COMPLETED:
            raise HTTPException(
                status_code=400, 
                detail=f"Task is not completed yet. Current status: {task.status}, message: {task.message}"
            )
        
        # Get suppliers associated with this task's search
        suppliers = await Supplier.find(
            {"component_type": task.component, "country": task.country}
        ).sort(("created_at", -1)).limit(task.supplier_count or 100).to_list()
        
        if not suppliers:
            logger.warning(f"No suppliers found for completed task {task_id}")
        
        return suppliers
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid task ID format: {task_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving results for task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving results: {str(e)}")

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

@router.post("/process-search/{search_id}", response_model=List[Supplier])
async def process_search_result_by_id(search_id: str = Path(..., description="ID of the search result to process")):
    """
    Process a specific search result by its ID and create structured supplier objects.
    This endpoint is useful for testing the supplier extraction and summarization independently.
    """
    logger.info(f"Received request to process search result with ID: {search_id}")
    
    try:
        # Find the search result by ID
        search_result = await SearchResult.get(search_id)
        if not search_result:
            logger.warning(f"Search result with ID {search_id} not found")
            raise HTTPException(status_code=404, detail=f"Search result with ID {search_id} not found")
        
        logger.info(f"Found search result for {search_result.query_component} in {search_result.query_country}")
        
        # Process the search result into structured supplier objects
        logger.info("Processing search result into structured supplier data")
        start_time = datetime.now()
        
        suppliers = await process_search_result(search_result)
        
        end_time = datetime.now()
        processing_duration = (end_time - start_time).total_seconds()
        logger.info(f"Processing completed in {processing_duration} seconds, found {len(suppliers)} suppliers")
        
        # Save the structured suppliers to the database
        logger.debug(f"Saving {len(suppliers)} extracted suppliers to database")
        saved_count = 0
        for i, supplier in enumerate(suppliers):
            try:
                logger.debug(f"Saving supplier {i+1}/{len(suppliers)}: {supplier.name}")
                await supplier.create()
                saved_count += 1
            except Exception as save_error:
                logger.error(f"Failed to save supplier '{supplier.name}' to database: {str(save_error)}")
        
        logger.info(f"Successfully saved {saved_count}/{len(suppliers)} suppliers to database")
        
        return suppliers
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        
        error_traceback = traceback.format_exc()
        logger.error(f"Error processing search result: {str(e)}")
        logger.debug(f"Full traceback: {error_traceback}")
        raise HTTPException(status_code=500, detail=f"Error processing search result: {str(e)}")