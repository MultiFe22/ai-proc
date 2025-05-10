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
    prompt = f"""Given I'm a senior category manager for a company that manufactures appliances, I need a comprehensive procurement analysis for suppliers of {component} in {country}.

    As an experienced procurement specialist, provide me with in-depth research on the top suppliers, covering:
    
    CORE DETAILS:
    1. Company name
    2. Website URL
    3. Headquarters location and manufacturing facilities (if different)
    4. Year founded
    5. Company size (employees, annual revenue if available)
    
    PRODUCT ASSESSMENT:
    6. Detailed product offerings related to {component}
    7. Quality tiers (premium, mid-range, budget)
    8. Manufacturing capabilities and capacity
    9. Technical specifications and differentiators
    10. R&D capabilities and innovation focus
    
    SUPPLY CHAIN FACTORS:
    11. Lead times (standard and expedited if available)
    12. Minimum order quantities
    13. Production capacity
    14. Geographic distribution of facilities
    15. Certifications (ISO, industry-specific, sustainability)
    
    BUSINESS EVALUATION:
    16. Market reputation and standing
    17. Key competitive advantages
    18. Major clients or industries served
    19. Financial stability indicators
    20. Sustainability and ESG practices
    
    PROCUREMENT INSIGHTS:
    21. Pricing model and structure (price ranges if available)
    22. Contract terms flexibility
    23. Reliability assessment
    24. Any known supply chain disruption history
    25. Vendor relationship management approach
    26. Total cost of ownership considerations
    27. Shipping and logistics capabilities
    28. Import/export considerations specific to {country}
    29. Contact information (procurement department, if available)
    30. Negotiation leverage points and strategies
    
    For each supplier, conduct a strategic assessment that includes:
    - SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
    - Risk assessment (1-10 scale with 10 being highest risk)
    - Strategic fit for appliance manufacturers
    - Comparison with industry benchmarks
    - Potential for long-term partnership development
    
    Return the results in a structured JSON format if possible, but ensure all key insights are included regardless of format.
    
    Today's date is {datetime.now().strftime('%Y-%m-%d')}.
    Provide at least 5 diverse suppliers if possible, with comprehensive analysis for each.
    Ensure your assessments include both objective factors and subjective procurement insights that would help with sourcing decisions.
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
