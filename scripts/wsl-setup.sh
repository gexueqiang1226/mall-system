#!/bin/bash
#
# Mall System - WSL Ubuntu One-Click Setup (Spring Boot 3.x + Java 17)
# Run: bash /mnt/c/develop/serverproj/mall-system/scripts/wsl-setup.sh
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_DIR="/mnt/c/develop/serverproj/mall-system"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Mall System - WSL Ubuntu 一键部署${NC}"
echo -e "${BLUE}  Spring Boot 3.1 + Java 17 + MySQL 8 + Redis${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# ===========================
# Step 1: Fix apt sources (replace aliyun with tuna)
# ===========================
info "Step 1/7: 修复 apt 源 (切换到清华源)..."

if [ -f /etc/apt/sources.list.d/ubuntu.sources ]; then
    sudo sed -i 's|mirrors.aliyun.com|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/ubuntu.sources 2>/dev/null || true
    sudo sed -i 's|archive.ubuntu.com|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/ubuntu.sources 2>/dev/null || true
fi
sudo sed -i 's|mirrors.aliyun.com|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list 2>/dev/null || true
sudo sed -i 's|archive.ubuntu.com|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list 2>/dev/null || true

info "更新软件源..."
sudo apt-get update -qq

# ===========================
# Step 2: Base tools
# ===========================
info "Step 2/7: 安装基础工具..."
sudo apt-get install -y -qq curl wget git unzip software-properties-common > /dev/null 2>&1

# ===========================
# Step 3: Java 17
# ===========================
JAVA_VER=$(java -version 2>&1 | head -1)
if echo "$JAVA_VER" | grep -q "17"; then
    info "Java 17 已安装: $JAVA_VER"
else
    info "Step 3/7: 安装 Java 17..."
    sudo apt-get install -y -qq openjdk-17-jdk > /dev/null 2>&1

    # Set Java 17 as default
    if [ -x /usr/lib/jvm/java-17-openjdk-amd64/bin/java ]; then
        sudo update-alternatives --set java /usr/lib/jvm/java-17-openjdk-amd64/bin/java 2>/dev/null || true
    fi

    info "Java 安装完成: $(java -version 2>&1 | head -1)"
fi

# Verify Java version
if ! java -version 2>&1 | grep -q "17"; then
    error "Java 17 未正确安装! 当前版本: $(java -version 2>&1 | head -1)"
    error "请手动安装: sudo apt-get install openjdk-17-jdk"
    exit 1
fi

# ===========================
# Step 4: Maven
# ===========================
if command -v mvn &> /dev/null; then
    info "Maven 已安装: $(mvn -version 2>&1 | head -1)"
else
    info "Step 4/7: 安装 Maven..."
    sudo apt-get install -y -qq maven > /dev/null 2>&1
    info "Maven 安装完成: $(mvn -version 2>&1 | head -1)"
fi

# ===========================
# Step 5: MySQL 8
# ===========================
if command -v mysql &> /dev/null; then
    info "MySQL 已安装: $(mysql --version)"
else
    info "Step 5/7: 安装 MySQL..."
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server > /dev/null 2>&1
    sudo service mysql start 2>/dev/null || true
    sleep 3

    info "配置 MySQL root 密码..."
    sudo mysql -u root << 'EOSQL'
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
FLUSH PRIVILEGES;
EOSQL
    info "MySQL 安装完成"
fi

sudo service mysql start 2>/dev/null || true

# ===========================
# Step 6: Redis
# ===========================
if command -v redis-server &> /dev/null; then
    info "Redis 已安装: $(redis-server --version 2>&1 | head -1)"
else
    info "Step 6/7: 安装 Redis..."
    sudo apt-get install -y -qq redis-server > /dev/null 2>&1
    sudo sed -i 's/^requirepass.*/# requirepass/' /etc/redis/redis.conf 2>/dev/null || true
    info "Redis 安装完成"
fi

sudo service redis-server start 2>/dev/null || true

# ===========================
# Step 7: Build & Init DB
# ===========================
info "Step 7/7: 初始化数据库 & 构建项目..."

# Init database
info "初始化数据库..."
sudo mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS mall_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
sudo mysql -u root -proot mall_system < "$PROJECT_DIR/backend/src/main/resources/db/init.sql" 2>/dev/null || {
    warn "有密码方式失败，尝试无密码..."
    sudo mysql -u root mall_system < "$PROJECT_DIR/backend/src/main/resources/db/init.sql" 2>/dev/null || {
        error "数据库初始化失败，请手动执行:"
        echo "  sudo mysql -u root -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';\""
        echo "  mysql -u root -proot mall_system < backend/src/main/resources/db/init.sql"
    }
}
info "数据库初始化完成"

# Build
info "构建后端 (Maven 首次下载依赖约 3-5 分钟)..."
cd "$PROJECT_DIR/backend"
mvn clean install -DskipTests -q 2>&1 | tail -3

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    error "构建失败! 请检查上面错误信息"
    exit 1
fi

info "构建成功!"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  全部完成!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${YELLOW}启动后端 (WSL 中执行):${NC}"
echo "    cd $PROJECT_DIR/backend"
echo "    mvn spring-boot:run"
echo ""
echo -e "  ${YELLOW}启动后台管理 (Windows PowerShell 中执行):${NC}"
echo "    cd C:\\develop\\serverproj\\mall-system\\admin"
echo "    npm install && npm run dev"
echo ""
echo -e "  ${GREEN}访问地址:${NC}"
echo "    API 文档:  http://localhost:8080/swagger-ui.html"
echo "    后台管理:  http://localhost:5173  (admin / admin123)"
echo ""

read -p "是否现在启动后端? [Y/n] " answer
if [ "$answer" != "n" ] && [ "$answer" != "N" ]; then
    info "启动后端... (Ctrl+C 停止)"
    echo ""
    cd "$PROJECT_DIR/backend"
    mvn spring-boot:run
fi
