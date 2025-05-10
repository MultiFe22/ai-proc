from celery import Celery
import os
from dotenv import load_dotenv
import logging
import sys
import json
from datetime import datetime
from beanie import PydanticObjectId

# Configure logging for Celery worker
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("worker.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables - make sure it happens BEFORE creating the Celery app
load_dotenv()

# Verify API key is available and log (without revealing the full key)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if ANTHROPIC_API_KEY:
    masked_key = ANTHROPIC_API_KEY[:4] + "..." + ANTHROPIC_API_KEY[-4:]
    logger.info(f"Anthropic API key loaded: {masked_key}")
else:
    logger.error("ANTHROPIC_API_KEY not found in environment variables!")

# Create Celery instance
celery_app = Celery(
    "procurement_assistant",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

# Import these here to avoid circular imports
from app.models.task import SupplierTask, TaskStatus

@celery_app.task(name="process_supplier_query", bind=True, max_retries=2)
def process_supplier_query(self, task_id, component, country):
    """
    Celery task to process a supplier query asynchronously.
    """
    logger.info(f"Starting Celery task processing for task {task_id}")

    # We need to set up a new event loop for async operations within Celery
    import asyncio
    
    async def _process_task():
        # Initialize the database connection
        from app.db import init_db
        await init_db()
        
        # Get the task
        task = await SupplierTask.get(PydanticObjectId(task_id))
        if not task:
            logger.error(f"Task {task_id} not found for processing")
            return
        
        try:
            # Update status to processing
            task.status = TaskStatus.PROCESSING
            task.message = "Starting supplier search with Claude AI..."
            await task.save()
            
            # Step 1: Use AI to search for suppliers
            from app.ai.web_search import search_suppliers
            
            # Verify environment variable is still available here
            from anthropic import Anthropic
            anthropic_key = os.getenv("ANTHROPIC_API_KEY")
            if not anthropic_key:
                raise ValueError("ANTHROPIC_API_KEY is missing in the environment")
                
            # Log key availability (without revealing the full key)
            masked_key = anthropic_key[:4] + "..." + anthropic_key[-4:] if anthropic_key else "None"
            logger.info(f"Using Anthropic API key: {masked_key}")
            
            # Continue with the search
            search_result = await search_suppliers(component=component, country=country)
            await search_result.create()
            
            # Update task with search result ID
            task.search_result_id = search_result.id
            task.message = "Web search completed, extracting supplier information..."
            await task.save()
            
            # Step 2: Process search results into structured suppliers
            from app.ai.summarizer import process_search_result
            suppliers = await process_search_result(search_result)
            
            # Step 3: Save suppliers to database
            saved_count = 0
            for supplier in suppliers:
                try:
                    await supplier.create()
                    saved_count += 1
                except Exception as save_error:
                    logger.error(f"Failed to save supplier '{supplier.name}' to database: {str(save_error)}")
            
            # Mark task as completed
            task.status = TaskStatus.COMPLETED
            task.message = f"Task completed successfully. Found {len(suppliers)} suppliers, saved {saved_count}."
            task.supplier_count = saved_count
            task.completed_at = datetime.now()
            await task.save()
            
            logger.info(f"Task {task_id} completed successfully. Processed {len(suppliers)} suppliers.")
            
        except ValueError as e:
            # Handle configuration errors
            error_message = f"Configuration error: {str(e)}"
            logger.error(error_message)
            
            task.status = TaskStatus.FAILED
            task.message = f"Failed: {error_message}"
            task.completed_at = datetime.now()
            await task.save()
            
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f"Error processing task {task_id}: {str(e)}")
            logger.debug(f"Full traceback: {error_traceback}")
            
            # Check if this is a retriable error (like a temporary API issue)
            if "500" in str(e) or "Internal server error" in str(e):
                try:
                    # Update task status to show retry attempt
                    task.message = f"Temporary error occurred, will retry: {str(e)}"
                    await task.save()
                    
                    # Retry the task
                    self.retry(countdown=10, exc=e)  # Retry after 10 seconds
                    return
                except self.MaxRetriesExceededError:
                    task.message = f"Failed after multiple retry attempts: {str(e)}"
            
            task.status = TaskStatus.FAILED
            task.message = f"Failed: {str(e)}"
            task.completed_at = datetime.now()
            await task.save()
    
    # Run the async function in a new event loop
    asyncio.run(_process_task())
    return f"Completed processing of task {task_id}"