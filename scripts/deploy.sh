#!/bin/bash
#
# Mall System - Docker Compose Deploy Script (Linux/macOS)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_requirements() {
    print_info "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_info "  https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed."
        exit 1
    fi

    print_info "All requirements satisfied."
}

create_env_file() {
    if [ -f "$ENV_FILE" ]; then
        print_info ".env file already exists, skipping."
        return
    fi

    print_info "Creating .env file..."
    cat > "$ENV_FILE" << 'EOF'
# Mall System Environment Configuration
# Modify these values for your deployment

# MySQL
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=mall_system

# Redis
REDIS_PASSWORD=redis123

# JWT (MUST change for production!)
JWT_SECRET=mall-system-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256
JWT_EXPIRATION=86400000

# Admin Frontend API Base URL
VITE_API_BASE_URL=http://localhost:8080
EOF

    print_info ".env file created. Review and modify as needed: $ENV_FILE"
}

generate_password_hash() {
    if command -v python3 &> /dev/null; then
        python3 -c "
import bcrypt
password = 'admin123'
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10))
print(hashed.decode('utf-8'))
" 2>/dev/null || echo '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi'
    else
        echo '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi'
    fi
}

do_start() {
    check_requirements
    create_env_file

    print_info "Starting Mall System..."
    cd "$PROJECT_DIR"

    if command -v docker compose &> /dev/null; then
        docker compose up -d --build
    else
        docker-compose up -d --build
    fi

    print_info "Waiting for services to be ready..."
    sleep 10

    do_status
    echo ""
    print_info "Mall System is running!"
    print_info "  Backend API:   http://localhost:8080"
    print_info "  API Docs:      http://localhost:8080/swagger-ui.html"
    print_info "  Admin Panel:   http://localhost:5173"
    print_info "  Default Login: admin / admin123"
}

do_stop() {
    print_info "Stopping Mall System..."
    cd "$PROJECT_DIR"
    if command -v docker compose &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    print_info "Mall System stopped."
}

do_restart() {
    do_stop
    do_start
}

do_status() {
    cd "$PROJECT_DIR"
    if command -v docker compose &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

do_logs() {
    local service="${1:-}"
    cd "$PROJECT_DIR"
    if [ -n "$service" ]; then
        if command -v docker compose &> /dev/null; then
            docker compose logs -f "$service"
        else
            docker-compose logs -f "$service"
        fi
    else
        if command -v docker compose &> /dev/null; then
            docker compose logs -f
        else
            docker-compose logs -f
        fi
    fi
}

do_health() {
    print_info "Checking service health..."

    # Check backend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/swagger-ui.html | grep -q "200\|302"; then
        print_info "Backend:   OK (http://localhost:8080)"
    else
        print_error "Backend:   NOT responding"
    fi

    # Check admin
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200"; then
        print_info "Admin:     OK (http://localhost:5173)"
    else
        print_error "Admin:     NOT responding"
    fi

    # Check MySQL
    if nc -z localhost 3306 2>/dev/null; then
        print_info "MySQL:     OK (localhost:3306)"
    else
        print_warn "MySQL:     Cannot verify (nc not available or port not open)"
    fi

    # Check Redis
    if nc -z localhost 6379 2>/dev/null; then
        print_info "Redis:     OK (localhost:6379)"
    else
        print_warn "Redis:     Cannot verify (nc not available or port not open)"
    fi
}

do_reset() {
    print_warn "This will DELETE all data (database, redis). Are you sure? [y/N]"
    read -r confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_info "Reset cancelled."
        return
    fi

    cd "$PROJECT_DIR"
    if command -v docker compose &> /dev/null; then
        docker compose down -v
    else
        docker-compose down -v
    fi
    print_info "All data volumes removed. Run '$0 start' to reinitialize."
}

usage() {
    cat << EOF
Mall System Deploy Script

Usage: $0 <command> [options]

Commands:
  start     Start all services (build + run)
  stop      Stop all services
  restart   Restart all services
  status    Show service status
  logs      Show logs (optional: logs backend|admin|mysql|redis)
  health    Check service health
  reset     Remove all data and stop services
  help      Show this help message

Examples:
  $0 start
  $0 logs backend
  $0 health
EOF
}

case "${1:-}" in
    start)   do_start ;;
    stop)    do_stop ;;
    restart) do_restart ;;
    status)  do_status ;;
    logs)    do_logs "${2:-}" ;;
    health)  do_health ;;
    reset)   do_reset ;;
    help|--help|-h) usage ;;
    *)       usage; exit 1 ;;
esac
