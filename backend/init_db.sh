#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up MongoDB for AI Procurement Assistant using Docker...${NC}"

# Check if Docker is installed
if ! command -v docker &>/dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &>/dev/null; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env file created. Using default MongoDB settings.${NC}"
fi

# Source the .env file to get MongoDB configuration
source <(grep -v '^#' .env | sed -E 's/(.*)=(.*)/export \1="\2"/')

# Set default values if not found in .env
MONGODB_PORT=${MONGODB_PORT:-27017}
MONGODB_DB_NAME=${MONGODB_DB_NAME:-procurement_assistant}
MONGODB_USER=${MONGODB_USER:-admin}
MONGODB_PASSWORD=${MONGODB_PASSWORD:-password}
MONGO_CONTAINER_NAME=${MONGO_CONTAINER_NAME:-procurement-mongodb}

# Check if MongoDB container is already running
if docker ps | grep -q $MONGO_CONTAINER_NAME; then
    echo -e "${YELLOW}MongoDB container is already running.${NC}"
    echo -e "${GREEN}MongoDB is ready to use at: mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@localhost:${MONGODB_PORT}/${MONGODB_DB_NAME}${NC}"
    exit 0
fi

# Check if MongoDB container exists but is not running
if docker ps -a | grep -q $MONGO_CONTAINER_NAME; then
    echo -e "${YELLOW}Starting existing MongoDB container...${NC}"
    docker start $MONGO_CONTAINER_NAME
else
    # Create MongoDB container with data persistence
    echo -e "${YELLOW}Creating MongoDB container...${NC}"
    docker run --name $MONGO_CONTAINER_NAME \
        -e MONGO_INITDB_ROOT_USERNAME=$MONGODB_USER \
        -e MONGO_INITDB_ROOT_PASSWORD=$MONGODB_PASSWORD \
        -e MONGO_INITDB_DATABASE=$MONGODB_DB_NAME \
        -p $MONGODB_PORT:27017 \
        -v mongodb_data:/data/db \
        -d mongo:latest
fi

# Wait for MongoDB to start
echo -e "${YELLOW}Waiting for MongoDB to start...${NC}"
sleep 5

# Check if MongoDB container is running
if docker ps | grep -q $MONGO_CONTAINER_NAME; then
    echo -e "${GREEN}MongoDB container is now running.${NC}"
    
    # Update the .env file with MongoDB URI if it's not already set
    if ! grep -q "^MONGODB_URI=" .env; then
        echo "MONGODB_URI=mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@localhost:${MONGODB_PORT}/${MONGODB_DB_NAME}" >> .env
        echo -e "${GREEN}Updated .env file with MongoDB URI.${NC}"
    fi
    
    echo -e "${GREEN}MongoDB is ready to use at: mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@localhost:${MONGODB_PORT}/${MONGODB_DB_NAME}${NC}"
    echo -e "${YELLOW}Note: If you're running the app in Docker too, use 'host.docker.internal' instead of 'localhost' in your connection string.${NC}"
else
    echo -e "${RED}Failed to start MongoDB container. Please check Docker logs.${NC}"
    exit 1
fi

echo -e "${GREEN}MongoDB initialization complete!${NC}"