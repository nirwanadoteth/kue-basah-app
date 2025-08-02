#!/bin/bash

echo "🔍 Running README.md documentation tests..."
echo "==========================================="

# Check if Jest is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm."
    exit 1
fi

# Install Jest if not present
if ! npm list jest &> /dev/null; then
    echo "📦 Installing Jest for testing..."
    npm install --save-dev jest @types/jest
fi

echo "🧪 Running documentation validation tests..."

# Run the specific documentation tests
npx jest tests/documentation/ --verbose

echo ""
echo "🔧 Running standalone README validator..."

# Run the standalone validator
node tests/documentation/validate-readme.js

echo ""
echo "✅ Documentation tests completed!"
