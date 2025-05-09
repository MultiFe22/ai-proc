import os
import traceback
from typing import List, Dict, Any
from anthropic import Anthropic
from dotenv import load_dotenv
import logging
from datetime import datetime

from app.models.supplier import Supplier

# Configure logger
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
logger.debug("Environment variables loaded in summarizer.py")

# Initialize Anthropic client
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    logger.error("ANTHROPIC_API_KEY is not set in environment variables")
else:
    logger.debug("ANTHROPIC_API_KEY found in environment variables")

try:
    anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
    logger.debug("Anthropic client initialized successfully in summarizer module")
except Exception as e:
    logger.error(f"Failed to initialize Anthropic client in summarizer: {str(e)}")
    raise e

async def generate_supplier_summary(supplier: Supplier) -> str:
    """
    Generate a concise summary and evaluation of a supplier 
    using Anthropic's Claude model.
    """
    logger.debug(f"Generating summary for supplier: {supplier.name}")
    
    # Create a prompt that includes all relevant supplier information
    prompt = f"""
    Please provide a concise evaluation summary of this supplier:
    
    Name: {supplier.name}
    Website: {supplier.website if supplier.website else "N/A"}
    Location: {supplier.location if supplier.location else "N/A"}
    Product: {supplier.product if supplier.product else "N/A"}
    Component Type: {supplier.component_type}
    Country: {supplier.country}
    Lead Time (days): {supplier.lead_time_days if supplier.lead_time_days else "Unknown"}
    Minimum Order Quantity: {supplier.min_order_qty if supplier.min_order_qty else "Unknown"}
    Certifications: {', '.join(supplier.certifications) if supplier.certifications else "None/Unknown"}
    
    Focus on:
    1. Key strengths of this supplier
    2. Potential concerns or limitations
    3. Assessment of their suitability for procurement of {supplier.component_type}
    4. Any notable advantages compared to typical suppliers in this space
    
    Keep the summary to 2-3 paragraphs maximum.
    """
    logger.debug("Summary prompt created")
    
    try:
        # Call Anthropic API
        logger.debug(f"Calling Claude (haiku model) to generate summary")
        start_time = datetime.now()
        
        response = anthropic_client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=3000,
            temperature=0.3,
            system="You are a procurement analyst providing objective evaluations of suppliers.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        logger.debug(f"Claude summary generation completed in {duration} seconds")
        
        # Extract the response content - UPDATED to handle the complex JSON structure
        content_items = response.content
        summary = ""
        
        # Process different content types according to the expected JSON structure
        logger.debug(f"Processing {len(content_items)} content items from Claude API response")
        
        for item in content_items:
            if item.type == "text":
                summary += item.text
                logger.debug(f"Found text content, length: {len(item.text)} characters")
        
        summary_length = len(summary)
        logger.debug(f"Generated summary of {summary_length} characters")
        
        if summary_length < 50:
            logger.warning(f"Generated summary suspiciously short: {summary}")
        
        return summary
        
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error generating summary for supplier {supplier.name}: {str(e)}")
        logger.debug(f"Full traceback: {error_traceback}")
        
        # Check for specific error types
        if "status_code=401" in str(e):
            logger.critical("Authentication error with Claude API - check your API key")
        elif "status_code=429" in str(e):
            logger.critical("Rate limit exceeded with Claude API")
        
        error_message = f"Summary unavailable due to error: {str(e)}"
        logger.debug(f"Returning error message as summary: {error_message}")
        return error_message

async def summarize_suppliers(suppliers: List[Supplier]) -> List[Supplier]:
    """
    Generate summaries for a list of suppliers and update them in-place.
    """
    logger.info(f"Starting summary generation for {len(suppliers)} suppliers")
    success_count = 0
    
    start_time = datetime.now()
    
    for i, supplier in enumerate(suppliers):
        logger.debug(f"Processing supplier {i+1}/{len(suppliers)}: {supplier.name}")
        try:
            supplier.summary = await generate_supplier_summary(supplier)
            success_count += 1
        except Exception as e:
            logger.error(f"Failed to generate summary for supplier {supplier.name}: {str(e)}")
            supplier.summary = f"Summary generation failed: {str(e)}"
    
    end_time = datetime.now()
    total_duration = (end_time - start_time).total_seconds()
    avg_duration = total_duration / len(suppliers) if suppliers else 0
    
    logger.info(f"Summary generation completed. Success: {success_count}/{len(suppliers)}. Total time: {total_duration:.2f}s, Avg: {avg_duration:.2f}s per supplier")
    
    return suppliers