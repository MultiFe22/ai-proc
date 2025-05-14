import os
import json
from typing import List, Dict, Any
from anthropic import Anthropic
import traceback
from datetime import datetime
from dotenv import load_dotenv
import logging

from app.models.supplier import Supplier
from app.models.search_result import SearchResult

# Configure logger
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
logger.debug("Environment variables loaded in web_search.py")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    logger.error("ANTHROPIC_API_KEY is not set in environment variables")
else:
    logger.debug("ANTHROPIC_API_KEY found in environment variables")

try:
    anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
    logger.debug("Anthropic client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Anthropic client: {str(e)}")
    raise e

async def search_suppliers(component: str, country: str) -> SearchResult:
    """
    Use Claude with web search capability to find suppliers based on components and country.
    Store the raw Claude response in a SearchResult object for later processing.
    """
    logger.info(f"Starting supplier search for component: '{component}' in country: '{country}'")
    
    # Create prompt for a procurement specialist with detailed instructions
    prompt = f"""I'm a senior category manager sourcing {component} suppliers in {country} for appliance manufacturing.

    Please provide a concise analysis of at least 5 diverse suppliers, including for each:
    - Company name, website, headquarters, year founded
    - Product offerings and quality level for {component}
    - Manufacturing capacity and key certifications
    - Lead times, minimum order, and major clients/industries served
    - Market reputation, financial stability, and sustainability practices
    - Contact info (procurement if available)

    For each supplier, briefly assess:
    - Strengths and weaknesses
    - Risk level (1-10)
    - Strategic fit for appliance manufacturing

    Summarize in structured JSON if possible. Today's date: {datetime.now().strftime('%Y-%m-%d')}.
    Focus on actionable procurement insights.
    """
    logger.debug("Supplier search prompt created")
    
    try:
        # Call Claude API with web search enabled
        logger.debug("Preparing to call Claude API with web search enabled")
        logger.info(f"Using Claude model: claude-3-7-sonnet-20250219 for supplier search")
        
        start_time = datetime.now()
        logger.debug(f"Claude API call started at: {start_time.isoformat()}")
        
        response = anthropic_client.beta.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=20688,
            temperature=1,  # Slightly higher temperature for more diverse insights
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            tools=[
                {
                    "name": "web_search",
                    "type": "web_search_20250305"
                }
            ],
            thinking={
                "type": "enabled",
                "budget_tokens": 15331
            },
            betas=["web-search-2025-03-05"]
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Claude API call completed in {duration} seconds")
        
        # Filter the content to only include items with type 'text'
        content_items = response.content
        text_objects = [item for item in content_items if getattr(item, 'type', None) == 'text']
        
        # Create a list of text content from the filtered objects
        text_content = []
        for text_object in text_objects:
            text_content.append({
                "text": text_object.text,
               # "citations": getattr(text_object, 'citations', [])
            })
            
        logger.debug(f"Extracted {len(text_content)} text objects from Claude response")
        
        # Store only the filtered text content as JSON
        raw_content = json.dumps(text_content)
        
        search_result = SearchResult(
            query_component=component,
            query_country=country,
            raw_ai_response=raw_content
        )
        logger.info(f"Created SearchResult for {component} in {country}")
        return search_result
            
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error searching suppliers: {str(e)}")
        logger.debug(f"Full traceback: {error_traceback}")
        
        # Check for specific error types to provide more helpful messaging
        if "status_code=401" in str(e):
            logger.critical("Authentication error with Claude API - check your API key")
        elif "status_code=429" in str(e):
            logger.critical("Rate limit exceeded with Claude API")
        elif "status_code=500" in str(e):
            logger.critical("Server error from Claude API")
        
        raise e
