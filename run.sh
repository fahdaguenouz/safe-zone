#!/bin/bash
clear
echo "🚀 Quick Starting Buy 01 Microservices Ecosystem..."

# Load environment variables
if [ -f "./load_env.sh" ]; then
    source ./load_env.sh
fi

# Clean old logs
echo "🧹 Clearing old log files..."
rm -rf logs
mkdir -p logs

# Stop everything on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down all microservices..."
    pkill -P $$
    echo "✅ All services stopped safely."
    exit 0
}

trap cleanup SIGINT

# Start Eureka first
echo "📡 Starting discovery-server..."
cd backend/discovery-server || exit
./mvnw spring-boot:run > ../../logs/discovery-server.log 2>&1 &
cd ../..

echo "⏳ Waiting 15 seconds for Eureka to start..."
sleep 15

# Start other services
SERVICES=("api-gateway" "user-service" "product-service" "media-service")

echo "⚡ Starting remaining microservices (with incremental build)..."
for SERVICE in "${SERVICES[@]}"; do
    echo "⚙️ Starting $SERVICE..."
    cd "backend/$SERVICE" || exit
    ./mvnw spring-boot:run > "../../logs/$SERVICE.log" 2>&1 &
    cd ../..
done

echo ""
echo "✅ All services are spinning up in the background."
echo "📊 Eureka Dashboard: http://localhost:8761"
echo "📖 Central Swagger UI: http://localhost:8080/swagger-ui.html"
echo ""
echo "📄 You can monitor logs live in a separate terminal. Example:"
echo "   tail -f logs/api-gateway.log"
echo ""
echo "🛑 Press Ctrl+C to stop everything."

wait