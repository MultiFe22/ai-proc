#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up AI Procurement Assistant development environment...${NC}"

# Check if Python is installed
if command -v python3 &>/dev/null; then
    PYTHON_CMD=python3
elif command -v python &>/dev/null; then
    PYTHON_CMD=python
else
    echo -e "${RED}Error: Python is not installed. Please install Python 3.8 or newer.${NC}"
    exit 1
fi

# Check Python version
PY_VERSION=$($PYTHON_CMD -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo -e "${GREEN}Using Python version: ${PY_VERSION}${NC}"

# Create virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
$PYTHON_CMD -m venv venv

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env file created. Please update it with your API keys.${NC}"
else
    echo -e "${GREEN}.env file already exists.${NC}"
fi

echo -e "${GREEN}Setup complete! Virtual environment is ready.${NC}"
echo -e "${GREEN}To activate the virtual environment, run:${NC}"
echo -e "    ${YELLOW}source venv/bin/activate${NC}"
echo -e "${GREEN}To start the application, run:${NC}"
echo -e "    ${YELLOW}uvicorn app.main:app --reload${NC}"