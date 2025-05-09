from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
import os
import logging
import sys

from app.db import init_db
from app.routes.discovery import router as discovery_router

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
logger.info("Environment variables loaded")

# Create FastAPI app
app = FastAPI(
    title="AI-Powered Procurement Assistant API",
    description="API for an AI-powered procurement assistant that helps find and evaluate suppliers",
    version="1.0.0",
)
logger.info("FastAPI app created")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
logger.info("CORS middleware configured")

# Include routers
app.include_router(discovery_router)
logger.info("Routes registered")

@app.on_event("startup")
async def startup_db_client():
    """Initialize the database connection on startup."""
    logger.info("Initializing database connection")
    try:
        await init_db()
        logger.info("Database initialization complete")
    except Exception as e:
        logger.critical(f"Failed to initialize database: {str(e)}", exc_info=True)
        raise

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    logger.debug("Health check endpoint called")
    return {"status": "ok", "message": "AI Procurement Assistant API is running"}

if __name__ == "__main__":
    logger.info("Starting application server")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)