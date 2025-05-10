#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Redis container is already running
if docker ps | grep -q "procurement-redis"; then
    echo "Redis container is already running."
else
    # Check if Redis container exists but is not running
    if docker ps -a | grep -q "procurement-redis"; then
        echo "Starting existing Redis container..."
        docker start procurement-redis
    else
        # Create and start a new Redis container
        echo "Creating and starting a new Redis container..."
        docker run --name procurement-redis -p 6379:6379 -d redis:alpine
    fi
fi

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
sleep 2

# Check if Redis is running properly
if docker ps | grep -q "procurement-redis"; then
    echo "Redis is running successfully on localhost:6379"
    echo "Use the following Redis URL in your .env file:"
    echo "REDIS_URL=redis://localhost:6379/0"
else
    echo "Failed to start Redis container. Please check Docker logs."
    exit 1
fi