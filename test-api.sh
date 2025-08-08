#!/bin/bash
# Quick test script for API endpoints with auto-cleanup

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="./temp-test-files"
TEST_LOG="test-results.log"
CLEANUP_ON_EXIT=true

# Cleanup function
cleanup_test_files() {
    echo -e "${YELLOW}🧹 Cleaning up test files...${NC}"
    
    # Remove temporary test directory
    if [[ -d "$TEST_DIR" ]]; then
        rm -rf "$TEST_DIR"
        echo "✅ Removed temporary test directory: $TEST_DIR"
    fi
    
    # Remove test logs
    if [[ -f "$TEST_LOG" ]]; then
        rm -f "$TEST_LOG"
        echo "✅ Removed test log: $TEST_LOG"
    fi
    
    # Remove any .test.* files that might have been created
    find . -name "*.test.tmp" -type f -delete 2>/dev/null && echo "✅ Removed temporary test files"
    find . -name "*.spec.tmp" -type f -delete 2>/dev/null && echo "✅ Removed temporary spec files"
    find . -name "test-output-*" -type f -delete 2>/dev/null && echo "✅ Removed test output files"
    
    echo -e "${GREEN}✨ Cleanup complete!${NC}"
}

# Set up trap to ensure cleanup happens on script exit
trap cleanup_test_files EXIT

# Create temporary test directory
mkdir -p "$TEST_DIR"

echo -e "${GREEN}🧪 Testing API endpoints...${NC}"
echo "$(date): Starting API tests" > "$TEST_LOG"

# Function to test endpoint
test_endpoint() {
    local endpoint="$1"
    local description="$2"
    local test_file="$TEST_DIR/$(basename $endpoint).test.tmp"
    
    echo -e "\n${YELLOW}Testing $description:${NC}"
    echo "Testing $endpoint" >> "$TEST_LOG"
    
    # Make request and save to temp file
    if curl -s "http://localhost:5174$endpoint" > "$test_file" 2>&1; then
        # Check if response contains success indicator
        if jq '.success' "$test_file" >/dev/null 2>&1 && [[ $(jq '.success' "$test_file") == "true" ]]; then
            echo -e "${GREEN}✅ Success${NC}"
            echo "✅ $endpoint - SUCCESS" >> "$TEST_LOG"
        else
            echo -e "${RED}❌ Failed - Invalid response format${NC}"
            echo "❌ $endpoint - FAILED" >> "$TEST_LOG"
            cat "$test_file" | head -n 3
        fi
    else
        echo -e "${RED}❌ Failed to connect${NC}"
        echo "❌ $endpoint - CONNECTION FAILED" >> "$TEST_LOG"
    fi
}

# Test individual endpoints
test_endpoint "/api/apps" "Apps endpoint"
test_endpoint "/api/categories" "Categories endpoint"

# Test placeholder endpoint (different response format)
echo -e "\n${YELLOW}Testing Placeholder endpoint:${NC}"
placeholder_test="$TEST_DIR/placeholder.test.tmp"
curl -s "http://localhost:5174/api/placeholder?width=100&height=100&text=Test" > "$placeholder_test"
if [[ -s "$placeholder_test" ]] && file "$placeholder_test" | grep -q "image\|PNG\|SVG"; then
    echo -e "${GREEN}✅ Placeholder endpoint working${NC}"
    echo "✅ /api/placeholder - SUCCESS" >> "$TEST_LOG"
else
    echo -e "${RED}❌ Placeholder endpoint failed${NC}"
    echo "❌ /api/placeholder - FAILED" >> "$TEST_LOG"
fi

echo ""
echo -e "${GREEN}🎉 API test complete!${NC}"
echo "$(date): API tests completed" >> "$TEST_LOG"

# Show summary
echo -e "\n${YELLOW}📊 Test Summary:${NC}"
echo "Test files created in: $TEST_DIR"
echo "Test log: $TEST_LOG"

# Note: cleanup_test_files will be called automatically due to the trap
