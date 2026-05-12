# Mall System - 统一构建/测试/部署入口
# Usage: make <target>
#   make setup    - 安装依赖环境（Docker, Java, Node.js）
#   make build    - 构建所有模块
#   make test     - 运行单元测试
#   make up       - Docker Compose 启动所有服务
#   make down     - 停止所有服务
#   make health   - 检查服务健康状态
#   make deploy   - 完整部署（build + up + health）
#   make e2e      - 端到端测试（启动服务 + API 测试）
#   make clean    - 清理所有构建产物和容器

.PHONY: help setup build test up down restart status logs health deploy e2e clean

# 颜色定义（兼容 sh/bash）
GREEN  := $(shell printf '\033[0;32m')
YELLOW := $(shell printf '\033[1;33m')
RED    := $(shell printf '\033[0;31m')
BLUE   := $(shell printf '\033[0;34m')
NC     := $(shell printf '\033[0m')

# 默认目标
.DEFAULT_GOAL := help

help: ## 显示帮助信息
	@printf "\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "$(BLUE)  Mall System - 自动化构建/测试/部署$(NC)\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "\n"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-12s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@printf "\n"

# =============================================================================
# 环境检查
# =============================================================================

check-docker: ## 检查 Docker 是否安装
	@which docker > /dev/null 2>&1 || (printf "$(RED)[ERROR]$(NC) Docker 未安装，请运行: make setup\n" && exit 1)
	@docker compose version > /dev/null 2>&1 || (printf "$(RED)[ERROR]$(NC) Docker Compose 未安装\n" && exit 1)
	@printf "$(GREEN)[OK]$(NC) Docker 已安装: %s\n" "$$(docker --version)"

check-java: ## 检查 Java 是否安装
	@which java > /dev/null 2>&1 || (printf "$(RED)[ERROR]$(NC) Java 未安装\n" && exit 1)
	@printf "$(GREEN)[OK]$(NC) Java: %s\n" "$$(java -version 2>&1 | head -1)"

check-node: ## 检查 Node.js 是否安装
	@which node > /dev/null 2>&1 || (printf "$(RED)[ERROR]$(NC) Node.js 未安装\n" && exit 1)
	@printf "$(GREEN)[OK]$(NC) Node.js: %s\n" "$$(node -v)"

check-maven: ## 检查 Maven 是否安装
	@which mvn > /dev/null 2>&1 || (printf "$(RED)[ERROR]$(NC) Maven 未安装\n" && exit 1)
	@printf "$(GREEN)[OK]$(NC) Maven: %s\n" "$$(mvn -version 2>&1 | head -1)"

# =============================================================================
# 环境安装
# =============================================================================

setup: ## 安装/检查所有依赖环境
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "$(BLUE)  环境检查与安装$(NC)\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "\n"
	@$(MAKE) check-java
	@$(MAKE) check-maven
	@$(MAKE) check-node
	@$(MAKE) check-docker
	@printf "\n"
	@printf "$(GREEN)所有环境依赖已就绪！$(NC)\n"

# =============================================================================
# 构建
# =============================================================================

build-backend: check-java check-maven ## 构建后端（Spring Boot）
	@printf "$(BLUE)[BUILD]$(NC) 构建后端服务...\n"
	@cd backend && mvn clean package -DskipTests -q
	@printf "$(GREEN)[OK]$(NC) 后端构建完成: backend/target/mall-system-*.jar\n"

build-admin: check-node ## 构建后台管理（Vue 3）
	@printf "$(BLUE)[BUILD]$(NC) 构建后台管理...\n"
	@cd admin && npm install --quiet && npm run build
	@printf "$(GREEN)[OK]$(NC) 后台管理构建完成: admin/dist/\n"

build-weapp: check-node ## 构建小程序（Taro H5）
	@printf "$(BLUE)[BUILD]$(NC) 构建小程序 H5...\n"
	@cd weapp && npm install --quiet && npm run build:h5
	@printf "$(GREEN)[OK]$(NC) 小程序构建完成: weapp/dist/\n"

build: build-backend build-admin ## 构建所有模块（后端 + 后台管理）
	@printf "$(GREEN)========================================$(NC)\n"
	@printf "$(GREEN)  所有模块构建完成！$(NC)\n"
	@printf "$(GREEN)========================================$(NC)\n"

# =============================================================================
# 测试
# =============================================================================

test: check-java check-maven ## 运行后端单元测试
	@printf "$(BLUE)[TEST]$(NC) 运行单元测试...\n"
	@cd backend && mvn test
	@printf "$(GREEN)[OK]$(NC) 单元测试完成\n"

test-api: ## 运行 API 集成测试（需服务已启动）
	@printf "$(BLUE)[TEST]$(NC) 运行 API 集成测试...\n"
	@./scripts/test-api.sh

e2e: up ## 端到端测试：启动服务 + 运行 API 测试
	@printf "$(BLUE)[E2E]$(NC) 等待服务就绪（最多 60 秒）...\n"
	@bash -c ' \
		for i in {1..12}; do \
			code=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/swagger-ui.html 2>/dev/null || echo "000"); \
			if echo "$$code" | grep -q "200\\|302"; then \
				printf "  后端就绪 [HTTP $$code]\n"; \
				exit 0; \
			fi; \
			printf "  等待后端启动... ($$i/12)\n"; \
			sleep 5; \
		done; \
		printf "$(RED)[ERROR]$(NC) 后端启动超时\n"; \
		exit 1; \
	'
	@$(MAKE) health
	@printf "$(BLUE)[E2E]$(NC) 运行 API 测试...\n"
	@./scripts/test-api.sh || (printf "$(RED)[FAIL]$(NC) API 测试失败\n" && exit 1)
	@printf "$(GREEN)[OK]$(NC) 端到端测试全部通过！\n"

# =============================================================================
# Docker Compose 操作
# =============================================================================

up: check-docker ## Docker Compose 启动所有服务
	@printf "$(BLUE)[DEPLOY]$(NC) 启动所有服务...\n"
	@sg docker -c "docker compose up -d --build"
	@printf "$(GREEN)[OK]$(NC) 服务已启动\n"
	@printf "\n"
	@printf "$(YELLOW)服务访问地址:$(NC)\n"
	@printf "  后端 API:     http://localhost:8080\n"
	@printf "  API 文档:     http://localhost:8080/swagger-ui.html\n"
	@printf "  后台管理:     http://localhost:5173\n"
	@printf "  MySQL:        localhost:3307\n"
	@printf "  Redis:        localhost:6380\n"

down: check-docker ## 停止所有服务
	@printf "$(BLUE)[STOP]$(NC) 停止所有服务...\n"
	@sg docker -c "docker compose down"
	@printf "$(GREEN)[OK]$(NC) 服务已停止\n"

restart: down up ## 重启所有服务

status: check-docker ## 查看服务状态
	@sg docker -c "docker compose ps"

logs: check-docker ## 查看日志（用法: make logs SERVICE=backend）
	@if [ -n "$(SERVICE)" ]; then \
		sg docker -c "docker compose logs -f $(SERVICE)"; \
	else \
		sg docker -c "docker compose logs -f"; \
	fi

# =============================================================================
# 健康检查
# =============================================================================

health: ## 检查所有服务健康状态
	@printf "\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "$(BLUE)  服务健康检查$(NC)\n"
	@printf "$(BLUE)========================================$(NC)\n"
	@printf "\n"
	@bash -c ' \
		PASS=0; FAIL=0; \
		GREEN="\033[0;32m"; RED="\033[0;31m"; NC="\033[0m"; \
		check_http() { \
			name="$$1"; url="$$2"; expected="$$3"; \
			code=$$(curl -s -o /dev/null -w "%{http_code}" "$$url" 2>/dev/null || echo "000"); \
			if echo "$$code" | grep -q "$$expected"; then \
				printf "  $${GREEN}✓ $$name$${NC}   ($$url) [HTTP $$code]\n"; \
				PASS=$$((PASS+1)); \
			else \
				printf "  $${RED}✗ $$name$${NC}   ($$url) [HTTP $$code, expected $$expected]\n"; \
				FAIL=$$((FAIL+1)); \
			fi; \
		}; \
		check_port() { \
			name="$$1"; host="$$2"; port="$$3"; \
			if timeout 2 bash -c ">/dev/tcp/$$host/$$port" 2>/dev/null; then \
				printf "  $${GREEN}✓ $$name$${NC}   ($$host:$$port) [OPEN]\n"; \
				PASS=$$((PASS+1)); \
			else \
				printf "  $${RED}✗ $$name$${NC}   ($$host:$$port) [CLOSED]\n"; \
				FAIL=$$((FAIL+1)); \
			fi; \
		}; \
		check_http "Backend  " "http://localhost:8080/swagger-ui.html" "200\\|302"; \
		check_http "Admin    " "http://localhost:5173" "200"; \
		check_port "MySQL    " "localhost" "3307"; \
		check_port "Redis    " "localhost" "6380"; \
		printf "\n"; \
		printf "结果: $${GREEN}$$PASS 通过$${NC}, $${RED}$$FAIL 失败$${NC}\n"; \
	'

# =============================================================================
# 一键部署
# =============================================================================

deploy: build up health ## 完整部署：构建 + 启动 + 健康检查
	@printf "$(GREEN)========================================$(NC)\n"
	@printf "$(GREEN)  部署完成！$(NC)\n"
	@printf "$(GREEN)========================================$(NC)\n"

# =============================================================================
# 清理
# =============================================================================

clean: check-docker ## 清理所有构建产物和容器
	@printf "$(YELLOW)[CLEAN]$(NC) 清理构建产物...\n"
	@cd backend && mvn clean -q
	@rm -rf admin/dist weapp/dist
	@sg docker -c "docker compose down -v" 2>/dev/null || true
	@printf "$(GREEN)[OK]$(NC) 清理完成\n"

reset: check-docker ## 重置所有数据（包括数据库）
	@printf "$(RED)[WARNING]$(NC) 这将删除所有数据！\n"
	@read -p "确认继续? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@sg docker -c "docker compose down -v"
	@printf "$(GREEN)[OK]$(NC) 数据已重置\n"
