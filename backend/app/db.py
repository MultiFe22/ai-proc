import motor.motor_asyncio
from beanie import init_beanie
from os import getenv
import urllib.parse
from dotenv import load_dotenv
import logging

from app.models.supplier import Supplier

# Configure logger
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
logger.debug("Environment variables loaded in db.py")

async def init_db():
    """Initialize the database connection."""
    logger.info("Starting database initialization")
    
    # Get MongoDB connection details from environment variables
    mongodb_user = getenv("MONGODB_USER", "admin")
    mongodb_password = getenv("MONGODB_PASSWORD", "password")
    mongodb_host = getenv("MONGODB_HOST", "localhost")
    mongodb_port = getenv("MONGODB_PORT", "27017")
    db_name = getenv("MONGODB_DB_NAME", "procurement_assistant")
    
    logger.debug(f"MongoDB connection parameters: user={mongodb_user}, host={mongodb_host}, port={mongodb_port}, db={db_name}")
    
    # URL encode the username and password to handle special characters
    encoded_username = urllib.parse.quote_plus(mongodb_user)
    encoded_password = urllib.parse.quote_plus(mongodb_password)
    logger.debug("Username and password URL encoded")
    
    # Construct the connection URI with authentication and authSource
    # The authSource=admin is critical because MongoDB stores user credentials in the admin database by default
    mongo_uri = f"mongodb://{encoded_username}:{encoded_password}@{mongodb_host}:{mongodb_port}/{db_name}?authSource=admin"
    
    # Log a sanitized version of the URI (without the actual password)
    sanitized_uri = f"mongodb://{encoded_username}:***@{mongodb_host}:{mongodb_port}/{db_name}?authSource=admin"
    logger.info(f"Connecting to MongoDB with URI: {sanitized_uri}")
    
    try:
        # Create a MongoDB client with authentication
        logger.debug("Creating AsyncIOMotorClient")
        client = motor.motor_asyncio.AsyncIOMotorClient(mongo_uri)
        
        # Test the connection
        logger.debug("Testing connection with ping command")
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Initialize Beanie with the Supplier document
        logger.debug(f"Initializing Beanie with document models: {[Supplier.__name__]}")
        await init_beanie(database=client[db_name], document_models=[Supplier])
        logger.info("Beanie initialization complete")
        
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {str(e)}", exc_info=True)
        logger.debug("Connection string used (sanitized): " + sanitized_uri)
        logger.debug("Check if MongoDB is running and credentials are correct")
        raise e