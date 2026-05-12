#!/bin/bash
#
# Mall System - 一键全量测试脚本
# 运行顺序: 单元测试 → 构建 → 启动服务 → API 集成测试 → 清理
#
# Usage:
#   ./scripts/test-all.sh           # 完整测试流程
#   ./scripts/test-all.sh --unit    # 仅单元测试
#   ./scripts/test-all.sh --api     # 仅 API 测试（需服务已启动）
#   ./scripts/test-all.sh --ci      # CI 模式（不启动/停止服务）
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=0

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
print_err()  { echo -e "${RED}[✗]${NC} $1"; }
print_info() { echo -e "${YELLOW}[ℹ]${NC} $1"; }

run_step() {
    local name="$1"
    shift
    TOTAL=$((TOTAL + 1))
    echo -e "${YELLOW}▶${NC} $name ..."
    if "$@"; then
        PASS=$((PASS + 1))
        print_ok "$name"
        return 0
    else
        FAIL=$((FAIL + 1))
        print_err "$name"
        return 1
    fi
}

# =============================================================================
# 测试步骤
# =============================================================================

step_unit_test() {
    cd "$PROJECT_DIR/backend"
    mvn clean test -q
}

step_build_backend() {
    cd "$PROJECT_DIR/backend"
    mvn clean package -DskipTests -q
}

step_build_admin() {
    cd "$PROJECT_DIR/admin"
    if [ ! -d "node_modules" ]; then
        npm install --quiet
    fi
    npm run build
}

step_docker_up() {
    cd "$PROJECT_DIR"
    docker compose up -d --build
    print_info "等待服务启动 (15s)..."
    sleep 15
}

step_health_check() {
    cd "$PROJECT_DIR"
    local max_wait=60
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/swagger-ui.html | grep -q "200\|302"; then
            print_ok "后端服务已就绪"
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
        echo -n "."
    done
    echo ""
    print_err "后端服务启动超时 (${max_wait}s)"
    return 1
}

step_api_test() {
    cd "$PROJECT_DIR"
    ./scripts/test-api.sh
}

step_docker_down() {
    cd "$PROJECT_DIR"
    docker compose down
}

# =============================================================================
# 主流程
# =============================================================================

MODE="${1:-full}"
START_TIME=$(date +%s)

case "$MODE" in
    --unit|-u)
        print_header "运行单元测试"
        run_step "后端单元测试" step_unit_test
        ;;

    --api|-a)
        print_header "运行 API 集成测试"
        run_step "API 集成测试" step_api_test
        ;;

    --ci)
        print_header "CI 模式测试"
        run_step "后端单元测试" step_unit_test
        run_step "构建后端" step_build_backend
        run_step "构建后台管理" step_build_admin
        ;;

    --build|-b)
        print_header "构建所有模块"
        run_step "构建后端" step_build_backend
        run_step "构建后台管理" step_build_admin
        ;;

    full|--full|-f|*)
        print_header "Mall System - 完整测试流程"
        print_info "模式: 单元测试 → 构建 → 启动服务 → API 测试 → 清理"
        echo ""

        # 1. 单元测试
        run_step "后端单元测试" step_unit_test || true

        # 2. 构建
        run_step "构建后端" step_build_backend || true
        run_step "构建后台管理" step_build_admin || true

        # 3. 启动服务
        run_step "Docker Compose 启动" step_docker_up || true

        # 4. 健康检查
        run_step "服务健康检查" step_health_check || true

        # 5. API 测试
        run_step "API 集成测试" step_api_test || true

        # 6. 清理
        print_info "清理服务..."
        step_docker_down || true
        ;;
esac

# =============================================================================
# 报告
# =============================================================================

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

print_header "测试报告"
echo -e "  总步骤: $TOTAL"
echo -e "  ${GREEN}通过: $PASS${NC}"
echo -e "  ${RED}失败: $FAIL${NC}"
echo -e "  耗时: ${DURATION}s"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}部分测试失败，请检查日志。${NC}"
    exit 1
fi
