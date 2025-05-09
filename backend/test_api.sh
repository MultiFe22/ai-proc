#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing AI Procurement Assistant API...${NC}"

# You can edit these values to change the search parameters
COMPONENT="carbon steel sheets"
COUNTRY="Germany"

echo -e "${YELLOW}Searching for suppliers of ${COMPONENT} in ${COUNTRY}...${NC}"
echo -e "${YELLOW}This may take some time as it performs AI web searches...${NC}"

curl -X POST "http://localhost:8000/discovery/query" \
  -H "Content-Type: application/json" \
  -d "{
    \"component\": \"${COMPONENT}\",
    \"country\": \"${COUNTRY}\"
  }"

echo -e "\n\n${GREEN}Search complete!${NC}"