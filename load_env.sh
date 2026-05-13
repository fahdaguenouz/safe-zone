#!/bin/bash

# Script to load environment variables from .env file
# Usage: source load_env.sh

if [ -f .env ]; then
    # Load variables, ignoring comments and empty lines
    export $(grep -v '^#' .env | xargs)
    echo "✅ Environment variables loaded from .env"
elif [ -f ../../.env ]; then
    export $(grep -v '^#' ../../.env | xargs)
    echo "✅ Environment variables loaded from ../../.env"
else
    echo "⚠️ Warning: .env file not found."
fi
