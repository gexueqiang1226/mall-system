#!/bin/bash
#
# Mall System - API Automated Test Script
# Uses curl to test all API endpoints and outputs a test report
#

set -e

BASE_URL="${1:-http://localhost:8080}"
ADMIN_TOKEN=""
USER_TOKEN=""

PASS=0
FAIL=0
TOTAL=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_pass() { echo -e "  ${GREEN}PASS${NC} $1"; PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); }
log_fail() { echo -e "  ${FAIL}FAIL${NC} $1 — $2"; FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); }

assert_code() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    if [ "$actual" = "$expected" ]; then
        log_pass "$desc"
    else
        log_fail "$desc" "expected code=$expected, got code=$actual"
    fi
}

assert_exists() {
    local desc="$1"
    local json="$2"
    local field="$3"
    local val=$(echo "$json" | grep -o "\"$field\":[^,}]*" | head -1)
    if [ -n "$val" ]; then
        log_pass "$desc"
        echo "$val"
    else
        log_fail "$desc" "field '$field' not found"
        echo ""
    fi
}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mall System API Test Suite${NC}"
echo -e "${BLUE}  Target: $BASE_URL${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ===========================
# 1. Admin Auth
# ===========================
echo -e "${YELLOW}[1. Admin Auth]${NC}"

RESP=$(curl -s -X POST "$BASE_URL/admin/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')

CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Admin login" "0" "$CODE"

ADMIN_TOKEN=$(echo "$RESP" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$ADMIN_TOKEN" ]; then
    log_pass "Got admin token"
else
    log_fail "Got admin token" "token is empty"
fi

# Wrong password
RESP=$(curl -s -X POST "$BASE_URL/admin/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}')
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Admin login with wrong password" "401" "$CODE"

echo ""

# ===========================
# 2. User Auth
# ===========================
echo -e "${YELLOW}[2. User Auth]${NC}"

TIMESTAMP=$(date +%s)
TEST_USER="testuser_${TIMESTAMP}"

# Register
RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$TEST_USER\",\"password\":\"test123\",\"phone\":\"13800000001\"}")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "User register" "0" "$CODE"

# Duplicate register
RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$TEST_USER\",\"password\":\"test123\"}")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Duplicate register" "409" "$CODE"

# Login
RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$TEST_USER\",\"password\":\"test123\"}")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "User login" "0" "$CODE"

USER_TOKEN=$(echo "$RESP" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$USER_TOKEN" ]; then
    log_pass "Got user token"
else
    log_fail "Got user token" "token is empty"
fi

echo ""

# ===========================
# 3. Products (Public)
# ===========================
echo -e "${YELLOW}[3. Products - Public]${NC}"

RESP=$(curl -s "$BASE_URL/api/products?page=1&size=10&isOnline=1")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "List products" "0" "$CODE"

RESP=$(curl -s "$BASE_URL/api/products/1")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Get product detail (id=1)" "0" "$CODE"

RESP=$(curl -s "$BASE_URL/api/products/999999")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Get nonexistent product" "404" "$CODE"

RESP=$(curl -s "$BASE_URL/api/products?keyword=iPhone&page=1&size=5")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Search products by keyword" "0" "$CODE"

echo ""

# ===========================
# 4. Categories (Public)
# ===========================
echo -e "${YELLOW}[4. Categories - Public]${NC}"

RESP=$(curl -s "$BASE_URL/api/categories")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "List all categories" "0" "$CODE"

RESP=$(curl -s "$BASE_URL/api/categories/0/children")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "List sub-categories" "0" "$CODE"

echo ""

# ===========================
# 5. Admin - Product Management
# ===========================
echo -e "${YELLOW}[5. Admin - Product Management]${NC}"

AUTH_HEADER="Authorization: Bearer $ADMIN_TOKEN"

# List products (admin)
RESP=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/admin/api/products?page=1&size=10")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Admin list products" "0" "$CODE"

# Create product
RESP=$(curl -s -X POST "$BASE_URL/admin/api/products" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"productName\":\"API Test Product\",\"productCode\":\"SKU-TEST-${TIMESTAMP}\",\"salePrice\":99.99,\"sellableStock\":100}")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Admin create product" "0" "$CODE"

PRODUCT_ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

# Update product
if [ -n "$PRODUCT_ID" ]; then
    RESP=$(curl -s -X PUT "$BASE_URL/admin/api/products/$PRODUCT_ID" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d '{"productName":"Updated API Test Product","salePrice":129.99}')
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin update product" "0" "$CODE"

    # Online
    RESP=$(curl -s -X POST "$BASE_URL/admin/api/products/$PRODUCT_ID/online" -H "$AUTH_HEADER")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin online product" "0" "$CODE"

    # Inventory update
    RESP=$(curl -s -X PUT "$BASE_URL/admin/api/products/$PRODUCT_ID/inventory" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d '{"sellableStock":200,"lowStockWarning":30,"reason":"API test"}')
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin update inventory" "0" "$CODE"

    # Offline
    RESP=$(curl -s -X POST "$BASE_URL/admin/api/products/$PRODUCT_ID/offline" -H "$AUTH_HEADER")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin offline product" "0" "$CODE"
else
    log_fail "Admin product operations" "no product ID"
fi

echo ""

# ===========================
# 6. Admin - Category Management
# ===========================
echo -e "${YELLOW}[6. Admin - Category Management]${NC}"

# Create category
RESP=$(curl -s -X POST "$BASE_URL/admin/api/categories" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"categoryName\":\"Test Category ${TIMESTAMP}\",\"parentId\":0,\"sortOrder\":99}")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Admin create category" "0" "$CODE"

CATEGORY_ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -n "$CATEGORY_ID" ]; then
    # List categories (admin)
    RESP=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/admin/api/categories?page=1&size=20")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin list categories" "0" "$CODE"

    # Update
    RESP=$(curl -s -X PUT "$BASE_URL/admin/api/categories/$CATEGORY_ID" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d '{"categoryName":"Updated Category","sortOrder":100}')
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin update category" "0" "$CODE"

    # Delete
    RESP=$(curl -s -X DELETE "$BASE_URL/admin/api/categories/$CATEGORY_ID" -H "$AUTH_HEADER")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin delete category" "0" "$CODE"
else
    log_fail "Admin category operations" "no category ID"
fi

echo ""

# ===========================
# 7. Order Flow
# ===========================
echo -e "${YELLOW}[7. Order Full Flow]${NC}"

# Use product 1 (should have stock from init.sql)
# Create order
RESP=$(curl -s -X POST "$BASE_URL/api/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"userId":2,"items":[{"productId":1,"quantity":1}]}')
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Create order" "0" "$CODE"

ORDER_ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -n "$ORDER_ID" ]; then
    # Get order detail
    RESP=$(curl -s -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/api/orders/$ORDER_ID")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Get order detail" "0" "$CODE"

    # List user orders
    RESP=$(curl -s -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/api/orders?userId=2&page=1&size=10")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "List user orders" "0" "$CODE"

    # Pay confirm
    RESP=$(curl -s -X POST -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/api/orders/$ORDER_ID/pay-confirm")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Pay confirm order" "0" "$CODE"

    # Admin ship
    RESP=$(curl -s -X PUT -H "$AUTH_HEADER" "$BASE_URL/admin/api/orders/$ORDER_ID/ship")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin ship order" "0" "$CODE"

    # Admin list orders
    RESP=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/admin/api/orders?page=1&size=10")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Admin list orders" "0" "$CODE"

    # Receive
    RESP=$(curl -s -X POST -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/api/orders/$ORDER_ID/receive")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Confirm receive order" "0" "$CODE"
else
    log_fail "Order flow" "no order ID created"
fi

# Test cancel flow with a new order
RESP=$(curl -s -X POST "$BASE_URL/api/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"userId":2,"items":[{"productId":2,"quantity":1}]}')
CANCEL_ORDER_ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -n "$CANCEL_ORDER_ID" ]; then
    RESP=$(curl -s -X POST -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/api/orders/$CANCEL_ORDER_ID/cancel")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Cancel order" "0" "$CODE"
fi

echo ""

# ===========================
# 8. Payment
# ===========================
echo -e "${YELLOW}[8. Payment Flow]${NC}"

# Create another order for payment test
RESP=$(curl -s -X POST "$BASE_URL/api/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"userId":2,"items":[{"productId":3,"quantity":1}]}')
PAY_ORDER_ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -n "$PAY_ORDER_ID" ]; then
    # Create payment
    RESP=$(curl -s -X POST "$BASE_URL/api/payments/create" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d "{\"orderId\":$PAY_ORDER_ID,\"paymentMethod\":\"wechat\"}")
    CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
    assert_code "Create payment" "0" "$CODE"

    PAYMENT_NO=$(echo "$RESP" | grep -o '"paymentNo":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$PAYMENT_NO" ]; then
        # Get payment
        RESP=$(curl -s -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/api/payments/$PAYMENT_NO")
        CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
        assert_code "Get payment detail" "0" "$CODE"

        # Payment callback
        RESP=$(curl -s -X POST -H "Authorization: Bearer $USER_TOKEN" "$BASE_URL/api/payments/$PAYMENT_NO/callback")
        CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
        assert_code "Payment callback" "0" "$CODE"
    else
        log_fail "Payment flow" "no payment number"
    fi
else
    log_fail "Payment flow" "no order created for payment"
fi

echo ""

# ===========================
# 9. Admin - Inventory Logs
# ===========================
echo -e "${YELLOW}[9. Admin - Inventory Logs]${NC}"

RESP=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/admin/api/inventory-logs?page=1&size=10")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "List inventory logs" "0" "$CODE"

RESP=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/admin/api/inventory-logs?productId=1&page=1&size=5")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "List inventory logs by product" "0" "$CODE"

echo ""

# ===========================
# 10. Dashboard
# ===========================
echo -e "${YELLOW}[10. Dashboard]${NC}"

RESP=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/admin/api/dashboard/stats")
CODE=$(echo "$RESP" | grep -o '"code":[0-9]*' | head -1 | cut -d: -f2)
assert_code "Get dashboard stats" "0" "$CODE"

echo ""

# ===========================
# 11. Auth Required Check
# ===========================
echo -e "${YELLOW}[11. Auth Required]${NC}"

RESP=$(curl -s "$BASE_URL/admin/api/products")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin/api/products")
if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "401" ]; then
    log_pass "Admin endpoint requires auth (HTTP $HTTP_CODE)"
else
    log_fail "Admin endpoint requires auth" "got HTTP $HTTP_CODE"
fi

RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin/api/dashboard/stats")
if [ "$RESP" = "403" ] || [ "$RESP" = "401" ]; then
    log_pass "Dashboard requires auth"
else
    log_fail "Dashboard requires auth" "got HTTP $RESP"
fi

echo ""

# ===========================
# Summary
# ===========================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "  Total: $TOTAL"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"

if [ "$FAIL" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}Some tests failed. Check output above.${NC}"
    exit 1
fi
