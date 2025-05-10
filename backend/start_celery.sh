#!/bin/bash

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Check if Redis is running using the start_redis script
echo "Checking Redis status..."
./start_redis.sh

# Load environment variables specifically for Celery
if [ -f "celery.env" ]; then
    echo "Loading Celery environment variables..."
    export $(grep -v '^#' celery.env | xargs)
fi

# Verify Anthropic API key is available
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ERROR: ANTHROPIC_API_KEY is not set! Please add it to celery.env"
    exit 1
else
    echo "ANTHROPIC_API_KEY is available"
fi

# Start Celery worker
echo "Starting Celery worker..."
celery -A app.worker worker --loglevel=info