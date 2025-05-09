import os
import json
from typing import List, Dict, Any
from anthropic import Anthropic
import traceback
from datetime import datetime
from dotenv import load_dotenv
import logging

from app.models.supplier import Supplier

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

async def search_suppliers(component: str, country: str) -> List[Supplier]:
    """
    Use Claude with web search capability to find suppliers based on components and country
    and parse the results into structured data with procurement specialist insights.
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
        
        # Extract the response content - UPDATED to handle the complex JSON structure
        content_items = response.content
        text_content = ""
        web_search_results = []
        thinking_content = ""
        
        # Process different content types according to the expected JSON structure
        logger.debug(f"Processing {len(content_items)} content items from Claude API response")
        
        for item in content_items:
            if item.type == "text":
                text_content += item.text
                logger.debug(f"Found text content, length: {len(item.text)} characters")
            elif item.type == "thinking":
                thinking_content += item.thinking
                logger.debug(f"Found thinking content, length: {len(item.thinking)} characters")
            elif item.type == "web_search_tool_result":
                logger.debug(f"Found web search tool result with ID: {item.tool_use_id}")
                web_search_results.extend(item.content)
        
        # Log information about what we found
        logger.info(f"Extracted {len(text_content)} chars of text, {len(web_search_results)} web results")
        
        # Response length check focuses on the main text content
        response_length = len(text_content)
        if response_length < 500:
            logger.warning(f"Claude API text response is suspiciously short: {text_content}")
        
        # Create rich response combining all content types for processing
        rich_response = {
            "text": text_content,
            "web_search_results": web_search_results,
            "thinking": thinking_content
        }
        
        # Process the response into structured supplier data
        logger.info("Parsing Claude response into supplier objects")
        suppliers = parse_claude_response(text_content, component, country, rich_response)
        
        logger.info(f"Found {len(suppliers)} suppliers for {component} in {country}")
        return suppliers
            
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

def parse_claude_response(response_content: str, component: str, country: str, rich_response: Dict = None) -> List[Supplier]:
    """
    Parse Claude's natural language response into structured Supplier objects.
    This function handles the conversion from Claude's web search results
    to our application's data structures.
    
    Args:
        response_content: The main text response from Claude
        component: The component being searched for
        country: The country being searched in
        rich_response: Optional dictionary containing all response content types
    """
    logger.info("Parsing Claude response into supplier data")
    suppliers = []
    
    try:
        # Store the full rich response for debugging and future enhancement
        raw_response = json.dumps(rich_response) if rich_response else response_content
        
        # Try to extract JSON if Claude returned structured data
        if "```json" in response_content:
            logger.debug("Found JSON format in Claude response")
            json_content = response_content.split("```json")[1].split("```")[0].strip()
            logger.debug(f"Extracted JSON content, length: {len(json_content)} characters")
            
            try:
                suppliers_data = json.loads(json_content)
                logger.info(f"Successfully parsed JSON data with {len(suppliers_data)} suppliers")
                
                # Process structured JSON data
                for i, supplier_data in enumerate(suppliers_data):
                    logger.debug(f"Processing supplier {i+1}/{len(suppliers_data)} from JSON data")
                    supplier = create_supplier_from_json(supplier_data, component, country, raw_response)
                    suppliers.append(supplier)
                    logger.debug(f"Added supplier: {supplier.name}")
                
            except json.JSONDecodeError as json_error:
                logger.error(f"JSON parse error: {str(json_error)}")
                logger.debug(f"Problematic JSON content: {json_content[:500]}...")
                raise
                
        else:
            logger.debug("No JSON format found in Claude response, attempting text parsing")
            # If not in JSON format, we need to extract supplier information from the text
            # Split the response by supplier sections (assuming Claude lists suppliers separately)
            sections = extract_supplier_sections(response_content)
            logger.debug(f"Extracted {len(sections)} potential supplier sections from text")
            
            for i, section in enumerate(sections):
                logger.debug(f"Processing supplier section {i+1}/{len(sections)}")
                supplier = create_supplier_from_text(section, component, country, raw_response)
                if supplier:
                    suppliers.append(supplier)
                    logger.debug(f"Added supplier: {supplier.name}")
                else:
                    logger.warning(f"Failed to extract supplier from section {i+1}")
    
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"Error parsing Claude response: {str(e)}")
        logger.debug(f"Full traceback: {error_traceback}")
        
        # Create a fallback supplier entry with the raw response
        logger.info("Creating fallback supplier entry with raw data")
        fallback_supplier = Supplier(
            name="See raw data for supplier information",
            website=None,
            location=None,
            product=f"Raw data contains information about {component}",
            component_type=component,
            country=country,
            lead_time_days=None,
            min_order_qty=None,
            certifications=[],
            raw_ai_source=raw_response,
            summary="Error occurred while parsing structured data. Please see raw data."
        )
        suppliers.append(fallback_supplier)
    
    return suppliers

def extract_supplier_sections(text: str) -> List[str]:
    """
    Extract individual supplier sections from Claude's response.
    Uses heuristics to identify where one supplier description ends and another begins.
    """
    logger.debug("Extracting supplier sections from text response")
    sections = []
    
    # Common section header patterns
    section_markers = [
        "Supplier", "Company", "Manufacturer", "Vendor", "Producer"
    ]
    
    # Split by common headers that might indicate a new supplier section
    current_section = ""
    lines = text.split('\n')
    logger.debug(f"Text contains {len(lines)} lines")
    
    for i, line in enumerate(lines):
        # Check if this line might be the start of a new supplier section
        is_new_section = False
        
        # Check for numbered lists like "1. Supplier Name" or headers with supplier names
        if any(marker in line for marker in section_markers):
            # Check if it's likely a header (length check is a simple heuristic)
            if len(line.strip()) < 100 and any(c.isdigit() for c in line[:3]):
                is_new_section = True
                logger.debug(f"Found section marker at line {i+1}: {line.strip()}")
            elif line.strip().startswith('#'):
                is_new_section = True
                logger.debug(f"Found header marker at line {i+1}: {line.strip()}")
        
        if is_new_section and current_section:
            sections.append(current_section.strip())
            logger.debug(f"Added section with {len(current_section)} characters")
            current_section = line
        else:
            current_section += "\n" + line
    
    # Add the last section
    if current_section:
        sections.append(current_section.strip())
        logger.debug(f"Added final section with {len(current_section)} characters")
    
    # If we couldn't identify clear sections, return the whole text as one section
    if not sections:
        logger.warning("No separate sections identified, treating entire text as one section")
        return [text]
    
    logger.info(f"Successfully extracted {len(sections)} sections from text")
    return sections

def create_supplier_from_json(data: Dict, component: str, country: str, raw_response: str) -> Supplier:
    """
    Create a Supplier object from structured JSON data.
    """
    try:
        logger.debug(f"Creating supplier from JSON data: {data.get('name', 'Unknown')}")
        
        # Check for required fields
        for field in ["name"]:
            if field not in data or not data[field]:
                logger.warning(f"Required field '{field}' missing in supplier data")
        
        supplier = Supplier(
            name=data.get("name", "Unknown"),
            website=data.get("website"),
            location=data.get("location"),
            product=data.get("product"),
            component_type=component,
            country=country,
            lead_time_days=data.get("lead_time_days"),
            min_order_qty=data.get("min_order_qty"),
            certifications=data.get("certifications", []),
            raw_ai_source=json.dumps(data),  # Store the full rich data
            summary=None  # Will be filled by the summarizer
        )
        
        logger.debug(f"Successfully created supplier object for: {supplier.name}")
        return supplier
        
    except Exception as e:
        logger.error(f"Error creating supplier from JSON: {str(e)}")
        logger.debug(f"Problematic JSON data: {data}")
        raise

def create_supplier_from_text(text: str, component: str, country: str, raw_response: str) -> Supplier:
    """
    Extract supplier information from a text section and create a Supplier object.
    Uses simple heuristics to identify key information.
    """
    # Extract name (assume it's in the first line or two)
    name = "Unknown"
    first_lines = text.strip().split('\n')[:2]
    for line in first_lines:
        if len(line) < 100 and not line.startswith('#') and not line.startswith('*'):
            name = line.strip().strip('0123456789.- ')
            break
    
    # Very simple extraction - in production, you'd want more robust NLP
    # These are simple pattern matches that look for common formats
    website = extract_value(text, ["Website:", "Website", "URL:", "URL"], url=True)
    location = extract_value(text, ["Location:", "Location", "Headquarters:", "Address:", "Based in"])
    product_desc = extract_value(text, ["Products:", "Product range:", "Offerings:"]) 
    if not product_desc:
        product_desc = f"{component} supplier" 
        
    # Try to extract numeric values
    lead_time = extract_number(text, ["Lead time:", "Lead time", "Delivery time:", "Delivery within"])
    min_qty = extract_number(text, ["Minimum order:", "MOQ:", "Minimum quantity:"])
    
    # Extract certifications (look for common cert patterns)
    certifications = []
    cert_indicators = ["ISO", "CE", "ASTM", "ASME", "EN", "DIN", "JIS", "UL", "FCC", "RoHS"]
    for indicator in cert_indicators:
        if indicator in text:
            # Try to find full certification strings
            for line in text.split('\n'):
                if indicator in line and len(line) < 100:
                    cert = line.strip()
                    if cert not in certifications:
                        certifications.append(cert)
    
    return Supplier(
        name=name,
        website=website,
        location=location,
        product=product_desc,
        component_type=component,
        country=country,
        lead_time_days=lead_time,
        min_order_qty=min_qty,
        certifications=certifications,
        raw_ai_source=text,  # Store the full section text
        summary=None  # Will be filled by the summarizer
    )

def extract_value(text: str, keywords: List[str], url: bool = False) -> str:
    """
    Extract a value from text based on keywords.
    """
    for keyword in keywords:
        if keyword in text:
            # Find the line containing the keyword
            for line in text.split('\n'):
                if keyword in line:
                    # Extract the value after the keyword
                    value = line.split(keyword, 1)[1].strip(': -\t')
                    
                    # For URLs, clean up common prefixes
                    if url and value:
                        value = value.replace("http://", "").replace("https://", "")
                        value = value.split(" ")[0]  # Take only the first part if there's additional text
                    
                    return value
    return None

def extract_number(text: str, keywords: List[str]) -> int:
    """
    Extract a numeric value from text based on keywords.
    """
    for keyword in keywords:
        if keyword in text:
            # Find the line containing the keyword
            for line in text.split('\n'):
                if keyword in line:
                    # Try to extract a number
                    import re
                    numbers = re.findall(r'\d+', line)
                    if numbers:
                        return int(numbers[0])
    return None