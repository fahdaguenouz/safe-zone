#!/bin/bash

# Stop the script if any command fails
set -e

# Load environment variables
if [ -f "./load_env.sh" ]; then
    source ./load_env.sh
fi

# Define the colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔨 Starting Multi-Service Build Process...${NC}\n"

# Array of service directories
SERVICES=(
    "backend/api-gateway"
    "backend/discovery-server"
    "backend/media-service"
    "backend/product-service"
    "backend/user-service"
)

# Loop through each service and build
for SERVICE in "${SERVICES[@]}"; do
    if [ -d "$SERVICE" ]; then
        echo -e "${BLUE}📦 Building Service:${NC} $SERVICE"
        
        # Move into directory, build, and come back automatically
        (
            cd "$SERVICE"
            # Ensure Maven Wrapper is executable
            chmod +x mvnw
            # Clean and Package
            ./mvnw clean package -DskipTests
        )
        
        echo -e "${GREEN}✅ Successfully built $SERVICE${NC}\n"
    else
        echo -e "${RED}❌ Directory $SERVICE not found. Skipping...${NC}\n"
    fi
done

echo -e "${GREEN}🚀 All services packaged successfully!${NC}"