# Mall System 部署指南

## 1. 系统要求

### 1.1 开发环境（最低配置）

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| 操作系统 | Windows 10+ / macOS / Linux | 64 位 |
| Java | 11+ (推荐 JDK 17) | 运行后端服务 |
| Node.js | 16+ (推荐 18 LTS) | 构建前端项目 |
| MySQL | 8.0+ | 数据库 |
| Redis | 6.0+ (推荐 7.0) | 缓存/库存锁 |
| Maven | 3.8+ | 后端构建工具 |
| 内存 | 4 GB+ | |
| 磁盘 | 10 GB+ 可用空间 | |

### 1.2 生产环境（推荐配置）

| 组件 | 推荐配置 |
|------|---------|
| CPU | 4 核+ |
| 内存 | 8 GB+ |
| 磁盘 | 50 GB+ SSD |
| MySQL | 8.0+，独立部署，建议 4GB+ 内存 |
| Redis | 7.0+，建议开启持久化 |
| Java | JDK 17 |
| Docker | 24.0+ (可选) |
| Docker Compose | 2.20+ (可选) |

### 1.3 端口清单

| 端口 | 服务 | 说明 |
|------|------|------|
| 8080 | Spring Boot 后端 | REST API 服务 |
| 5173 | Vue 后台管理 | 后台管理系统前端 |
| 3306 | MySQL | 数据库 |
| 6379 | Redis | 缓存服务 |
| 10000 | Taro H5 | 小程序 H5 开发服务 |

---

## 2. 本地开发环境搭建

### 2.1 安装基础环境

```bash
# 安装 Java 11+
# Windows: 下载并安装 JDK https://adoptium.net/
# macOS:
brew install openjdk@11

# 安装 Node.js 18+
# Windows: 下载 https://nodejs.org/
# macOS:
brew install node@18

# 安装 MySQL 8.0
# Windows: 下载 https://dev.mysql.com/downloads/
# macOS:
brew install mysql

# 安装 Redis
# Windows: 下载 https://github.com/tporadowski/redis/releases
# macOS:
brew install redis
```

### 2.2 初始化数据库

```bash
# 启动 MySQL
mysql -u root -p

# 执行初始化脚本
source backend/src/main/resources/db/init.sql
```

### 2.3 启动 Redis

```bash
# Linux/macOS
redis-server

# Windows
redis-server.exe
```

### 2.4 启动后端服务

```bash
cd backend

# 修改数据库配置（如需）
# 编辑 src/main/resources/application-dev.yml

# 构建并启动
mvn clean install -DskipTests
mvn spring-boot:run

# 验证启动
# 访问 http://localhost:8080/swagger-ui.html
```

### 2.5 启动后台管理系统

```bash
cd admin

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
# 默认账号: admin / admin123
```

### 2.6 启动小程序前端

```bash
cd weapp

# 安装依赖
npm install

# H5 开发模式
npm run dev:h5
# 访问 http://localhost:10000

# 微信小程序开发模式
npm run dev:weapp
# 使用微信开发者工具打开 weapp/dist 目录
```

---

## 3. Docker Compose 一键部署

### 3.1 前置要求

- Docker 24.0+
- Docker Compose 2.20+

### 3.2 配置环境变量（可选）

创建 `.env` 文件自定义配置：

```env
# MySQL
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=mall_system

# Redis
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=your-production-jwt-secret-key-must-be-at-least-256-bits
JWT_EXPIRATION=86400000

# Admin Frontend
VITE_API_BASE_URL=http://localhost:8080
```

### 3.3 启动所有服务

```bash
# 一键启动
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down

# 停止并清除数据卷（重置数据库）
docker-compose down -v
```

### 3.4 服务访问

| 服务 | 地址 |
|------|------|
| 后端 API | http://localhost:8080 |
| API 文档 | http://localhost:8080/swagger-ui.html |
| 后台管理 | http://localhost:5173 |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

---

## 4. 生产环境部署

### 4.1 后端打包

```bash
cd backend
mvn clean package -DskipTests
# 产物: target/mall-system-1.0.0.jar
```

### 4.2 前端打包

```bash
# 后台管理
cd admin
npm install
npm run build
# 产物: dist/ 目录

# 小程序 H5
cd weapp
npm install
npm run build:h5
# 产物: dist/ 目录
```

### 4.3 生产环境配置建议

#### 4.3.1 Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 后台管理前端
    location / {
        root /var/www/mall-admin/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Swagger 文档（可选，生产环境可关闭）
    location /swagger-ui/ {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

#### 4.3.2 后端生产环境配置

创建 `application-prod.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://your-mysql-host:3306/mall_system?useSSL=true&serverTimezone=UTC
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  redis:
    host: ${REDIS_HOST}
    port: 6379
    password: ${REDIS_PASSWORD}

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000

logging:
  level:
    root: WARN
    com.mall: INFO
```

启动命令：

```bash
java -jar mall-system-1.0.0.jar \
  --spring.profiles.active=prod \
  --spring.datasource.password=your_password \
  --spring.redis.password=your_redis_password
```

#### 4.3.3 Systemd 服务配置（Linux）

创建 `/etc/systemd/system/mall-backend.service`：

```ini
[Unit]
Description=Mall System Backend
After=network.target mysql.service redis.service

[Service]
Type=simple
User=mall
WorkingDirectory=/opt/mall
ExecStart=/usr/bin/java -jar /opt/mall/mall-system-1.0.0.jar --spring.profiles.active=prod
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable mall-backend
sudo systemctl start mall-backend
sudo systemctl status mall-backend
```

### 4.4 数据备份

```bash
# MySQL 备份
mysqldump -u root -p mall_system > backup_$(date +%Y%m%d).sql

# MySQL 恢复
mysql -u root -p mall_system < backup_20260510.sql

# Redis 持久化（确保 redis.conf 中配置了 save）
# 默认 dump.rdb 文件在 Redis 数据目录中
```

---

## 5. 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|-------|------|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/mall_system` | MySQL 连接地址 |
| `SPRING_DATASOURCE_USERNAME` | `root` | MySQL 用户名 |
| `SPRING_DATASOURCE_PASSWORD` | `root` | MySQL 密码 |
| `SPRING_REDIS_HOST` | `localhost` | Redis 地址 |
| `SPRING_REDIS_PORT` | `6379` | Redis 端口 |
| `SPRING_REDIS_PASSWORD` | (空) | Redis 密码 |
| `JWT_SECRET` | `mall-system-...` | JWT 签名密钥（生产环境必须修改） |
| `JWT_EXPIRATION` | `86400000` | JWT 过期时间（毫秒，默认24小时） |
| `VITE_API_BASE_URL` | `http://localhost:8080` | 后台管理前端 API 地址 |

---

## 6. 常见问题排查

### 6.1 后端启动失败

**问题：数据库连接失败**
```
com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
```
- 检查 MySQL 是否启动：`mysql -u root -p -e "SELECT 1"`
- 检查 `application-dev.yml` 中的连接地址和密码
- 检查防火墙是否放行 3306 端口

**问题：Redis 连接失败**
```
Unable to connect to Redis
```
- 检查 Redis 是否启动：`redis-cli ping`
- 如果 Redis 设置了密码，检查 `application-dev.yml` 中的 `spring.redis.password`

**问题：JWT 密钥太短**
```
io.jsonwebtoken.security.WeakKeyException
```
- 确保 `jwt.secret` 至少 256 位（32 字节）

### 6.2 前端构建失败

**问题：npm install 失败**
- 尝试使用国内镜像：`npm config set registry https://registry.npmmirror.com`
- 清除缓存：`npm cache clean --force`

**问题：Taro 编译报错**
- 确认 Node.js 版本 >= 16
- 删除 `node_modules` 和 `dist` 后重新安装

### 6.3 Docker 部署问题

**问题：容器无法启动**
- 查看日志：`docker-compose logs backend`
- 检查端口占用：`netstat -tlnp | grep 8080`

**问题：数据库初始化失败**
- 删除数据卷重新创建：`docker-compose down -v && docker-compose up -d`
