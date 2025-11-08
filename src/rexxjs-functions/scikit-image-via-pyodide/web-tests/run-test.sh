#!/bin/bash

# Run Scikit-Image via PyOdide Browser Tests

echo "🔬 Running Scikit-Image via PyOdide Browser Tests"
echo "================================================="
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root"
    exit 1
fi

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

echo "📦 Ensuring Playwright is installed..."
npm list @playwright/test > /dev/null 2>&1 || {
    echo "Installing Playwright..."
    npm install --save-dev @playwright/test
}

echo ""
echo "🚀 Starting test server on port 8083..."
npm run dev:test-server &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 3

echo ""
echo "🧪 Running Scikit-Image tests with Playwright..."
echo "⚠️  Note: This may take 2-3 minutes due to scikit-image package size"
echo ""

npx playwright test src/rexxjs-functions/scikit-image-via-pyodide/web-tests/scikit-image-test.spec.js
TEST_EXIT_CODE=$?

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Scikit-Image tests passed!"
    exit 0
else
    echo ""
    echo "❌ Scikit-Image tests failed"
    exit $TEST_EXIT_CODE
fi
