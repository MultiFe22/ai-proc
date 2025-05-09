import os
import json
import traceback
from typing import List, Dict, Any
from anthropic import Anthropic
from dotenv import load_dotenv
import logging
from datetime import datetime

from app.models.supplier import Supplier
from app.models.search_result import SearchResult

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

async def process_search_result(search_result: SearchResult) -> List[Supplier]:
    """
    Process a raw search result from Claude's web search into structured supplier objects.
    Uses Claude with function calling to extract and structure the supplier information.
    Now uses a single tool call that accepts an array of suppliers.
    
    Args:
        search_result: The SearchResult object containing raw Claude response
        
    Returns:
        List of structured Supplier objects
    """
    logger.info(f"Processing search result for {search_result.query_component} in {search_result.query_country}")
    
    try:
        # Parse the raw AI response which now contains only text objects
        text_objects = json.loads(search_result.raw_ai_response)
        
        # Extract text content from the filtered text objects
        text_content = ""
        for text_obj in text_objects:
            text_content += text_obj.get("text", "")
        
        logger.debug(f"Extracted {len(text_content)} characters of text content from {len(text_objects)} text objects")

        # Define tool that accepts an array of suppliers in a single call
        tools = [
            {
                "name": "create_suppliers",
                "description": "Create multiple structured supplier objects from extracted information",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "suppliers": {
                            "type": "array",
                            "description": "Array of supplier objects extracted from the research data",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "The name of the supplier company"
                                    },
                                    "website": {
                                        "type": "string",
                                        "description": "The website URL of the supplier (without http:// or https://)"
                                    },
                                    "location": {
                                        "type": "string",
                                        "description": "The headquarters location or primary address of the supplier"
                                    },
                                    "product": {
                                        "type": "string",
                                        "description": "Description of the supplier's products relevant to the search"
                                    },
                                    "lead_time_days": {
                                        "type": "integer",
                                        "description": "Typical lead time in days (numeric only)"
                                    },
                                    "min_order_qty": {
                                        "type": "integer",
                                        "description": "Minimum order quantity (numeric only)"
                                    },
                                    "certifications": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "description": "List of certifications held by the supplier"
                                    },
                                    "summary": {
                                        "type": "string",
                                        "description": "A concise summary of the supplier's strengths, weaknesses, and fit"
                                    }
                                },
                                "required": ["name"]
                            }
                        }
                    },
                    "required": ["suppliers"]
                }
            }
        ]
        
        # Create prompt for Claude to extract supplier information
        prompt = f"""
        You are a procurement specialist AI that extracts and structures information about suppliers from research data.
        
        I will provide you with research about suppliers of {search_result.query_component} in {search_result.query_country}.
        
        Your task is to:
        1. Carefully analyze the research data
        2. Identify all distinct suppliers mentioned in the data
        3. Extract key information for each supplier
        4. Call the create_suppliers tool ONCE with an array containing all identified suppliers
        5. Include a concise 2-3 paragraph summary for each supplier highlighting their strengths, weaknesses, and fit for procurement
        
        Make sure to:
        - Include every distinct supplier mentioned in the research
        - Extract as much information as possible for each field
        - Ensure accuracy of all data and don't fabricate information
        - For numeric fields (lead_time_days, min_order_qty), extract only the numbers
        - For website URLs, exclude http:// and https:// prefixes
        - Include specific certifications mentioned (ISO, CE, etc.)

        Important: Make only ONE call to the create_suppliers tool with ALL suppliers in a single array.
        """
        
        # Call to Claude with tool definition
        logger.debug("Making call to Claude with tool to extract multiple suppliers in one call")
        start_time = datetime.now()
        
        response = anthropic_client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=8000,
            temperature=0.1,  # Low temperature for accurate information extraction
            tools=tools,
            messages=[
                {
                    "role": "user", 
                    "content": f"{prompt}\n\nHere is the research data:\n\n{text_content[:80000]}"  # Limit size for API constraints
                }
            ]
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Claude extraction completed in {duration} seconds")
        
        # Process the response
        suppliers = []
        
        content_items = response.content
        text_output = ""
        
        # Check for the tool call with multiple suppliers
        for item in content_items:
            if getattr(item, 'type', None) == 'text':
                text_output += getattr(item, 'text', '')
            elif getattr(item, 'type', None) == 'tool_use' and getattr(item, 'name', None) == 'create_suppliers':
                logger.debug(f"Found create_suppliers tool call")
                tool_input = getattr(item, 'input', {})
                supplier_list = tool_input.get('suppliers', [])
                
                logger.info(f"Extracted {len(supplier_list)} suppliers in a single tool call")
                
                # Process each supplier in the array
                for i, supplier_data in enumerate(supplier_list):
                    logger.debug(f"Processing supplier {i+1}/{len(supplier_list)}: {supplier_data.get('name', 'Unknown')}")
                    
                    supplier = Supplier(
                        name=supplier_data.get('name', 'Unknown'),
                        website=supplier_data.get('website'),
                        location=supplier_data.get('location'),
                        product=supplier_data.get('product'),
                        component_type=search_result.query_component,
                        country=search_result.query_country,
                        lead_time_days=supplier_data.get('lead_time_days'),
                        min_order_qty=supplier_data.get('min_order_qty'),
                        certifications=supplier_data.get('certifications', []),
                        raw_ai_source=json.dumps(supplier_data),
                        summary=supplier_data.get('summary')
                    )
                    suppliers.append(supplier)
        
        # If Claude didn't find any suppliers, create a fallback supplier
        if not suppliers:
            logger.warning("No suppliers identified using Claude's function calling, using fallback")
            fallback_supplier = Supplier(
                name=f"AI Search Results: {search_result.query_component} in {search_result.query_country}",
                component_type=search_result.query_component,
                country=search_result.query_country,
                raw_ai_source=search_result.raw_ai_response,
                summary=f"These are raw search results that need manual processing. Search ID: {search_result.id}"
            )
            suppliers.append(fallback_supplier)
        
        # Update the search result as processed
        search_result.is_processed = True
        await search_result.save()
        logger.info(f"Marked search result {search_result.id} as processed")
        
        logger.info(f"Extracted {len(suppliers)} suppliers from search result")
        return suppliers
        
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error processing search result: {str(e)}")
        logger.debug(f"Full traceback: {error_traceback}")
        
        # Create fallback supplier with error message
        fallback_supplier = Supplier(
            name=f"Error Processing: {search_result.query_component} in {search_result.query_country}",
            component_type=search_result.query_component,
            country=search_result.query_country,
            raw_ai_source=search_result.raw_ai_response,
            summary=f"Error occurred while processing search results: {str(e)}"
        )
        
        return [fallback_supplier]

async def summarize_suppliers(suppliers: List[Supplier]) -> List[Supplier]:
    """
    Legacy method - maintained for backward compatibility.
    This now simply processes the supplied list and returns it.
    For new code, use process_search_result() instead.
    """
    logger.info("Using legacy summarize_suppliers method")
    return suppliers