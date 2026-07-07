#!/bin/bash

set -e

clear

# ===============================
# Colors
# ===============================
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ===============================
# Load Environment Variables
# ===============================
if [ -f "./load_env.sh" ]; then
    source ./load_env.sh
fi

echo -e "${BLUE}🚀 Buy01 Microservices Build & Start Script${NC}"
echo ""

# ===============================
# Cleanup
# ===============================
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all running Spring Boot services...${NC}"
    pkill -P $$ || true
    echo -e "${GREEN}✅ All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT

# ===============================
# Kill old Java processes (optional)
# ===============================
echo -e "${BLUE}🧹 Cleaning previous processes...${NC}"
pkill -f "spring-boot:run" || true

# ===============================
# Clean logs
# ===============================
echo -e "${BLUE}🧹 Cleaning logs...${NC}"
rm -rf logs
mkdir -p logs

# ===============================
# Services
# ===============================
SERVICES=(
    "discovery-server"
    "api-gateway"
    "user-service"
    "product-service"
    "media-service"
)

# ===============================
# Build
# ===============================
echo ""
echo -e "${BLUE}🔨 Building all services...${NC}"

for SERVICE in "${SERVICES[@]}"; do

    echo -e "${BLUE}📦 Building ${SERVICE}${NC}"

    (
        cd "backend/$SERVICE"

        chmod +x mvnw

        ./mvnw clean package -DskipTests \
            > "../../logs/${SERVICE}-build.log" 2>&1
    )

    echo -e "${GREEN}✅ ${SERVICE} built successfully${NC}"
done

echo ""
echo -e "${GREEN}🎉 All services compiled successfully.${NC}"

# ===============================
# Start Eureka
# ===============================
echo ""
echo -e "${BLUE}📡 Starting discovery-server...${NC}"

(
    cd backend/discovery-server
    ./mvnw spring-boot:run \
        > ../../logs/discovery-server.log 2>&1
) &

echo -e "${YELLOW}⏳ Waiting 15 seconds for Eureka...${NC}"
sleep 15

# ===============================
# Start Remaining Services
# ===============================
OTHER_SERVICES=(
    "api-gateway"
    "user-service"
    "product-service"
    "media-service"
)

echo ""
echo -e "${BLUE}🚀 Starting remaining services...${NC}"

for SERVICE in "${OTHER_SERVICES[@]}"; do

    echo -e "${BLUE}⚙️ Starting ${SERVICE}${NC}"

    (
        cd "backend/$SERVICE"
        ./mvnw spring-boot:run \
            > "../../logs/${SERVICE}.log" 2>&1
    ) &

    sleep 3
done

echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}✅ Buy01 Microservices are running!${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
echo "📡 Eureka Dashboard : http://localhost:8761"
echo "🌐 API Gateway      : http://localhost:8080"
echo "📖 Swagger          : http://localhost:8080/swagger-ui.html"
echo ""
echo "📂 Logs:"
echo "   logs/discovery-server.log"
echo "   logs/api-gateway.log"
echo "   logs/user-service.log"
echo "   logs/product-service.log"
echo "   logs/media-service.log"
echo ""
echo "Example:"
echo "   tail -f logs/product-service.log"
echo ""
echo "Press Ctrl+C to stop all services."

wait