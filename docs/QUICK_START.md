# 🚀 快速开始指南

## 环境准备

### 系统要求
- **Java**: 11+
- **Node.js**: 16+
- **MySQL**: 8.0+
- **Redis**: 6.0+
- **Git**: 最新版本

### IDE 推荐
- IntelliJ IDEA 2023+（后端）
- VS Code 1.7+（前端）
- 微信开发者工具（小程序调试）

---

## 步骤 1: 克隆项目

```bash
git clone https://github.com/gexueqiang1226/mall-system.git
cd mall-system
```

---

## 步骤 2: 配置后端

### 2.1 进入后端目录
```bash
cd backend
```

### 2.2 配置数据库

编辑 `src/main/resources/application-dev.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mall_system?useSSL=false&serverTimezone=UTC
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
  redis:
    host: localhost
    port: 6379
```

### 2.3 初始化数据库

```bash
# 使用 MySQL 客户端登录
mysql -u root -p

# 执行初始化脚本
CREATE DATABASE mall_system CHARACTER SET utf8mb4;
USE mall_system;
SOURCE src/main/resources/db/init.sql;
```

### 2.4 启动后端服务

```bash
# 构建项目
mvn clean install -DskipTests

# 启动应用（开发模式）
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# 或者使用 IDE 直接运行 MallApplication.java
```

✅ 后端启动成功，访问：http://localhost:8080

**查看 API 文档**：http://localhost:8080/swagger-ui.html

---

## 步骤 3: 配置后台管理系统

### 3.1 进入 admin 目录

```bash
cd ../admin
```

### 3.2 安装依赖

```bash
npm install
# 或使用 yarn
yarn install
```

### 3.3 配置 API 基础 URL

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```
VITE_API_BASE_URL=http://localhost:8080/admin/api
VITE_APP_TITLE=Mall System 后台管理
```

### 3.4 启动开发服务

```bash
npm run dev
```

✅ 后台管理系统启动成功，访问：http://localhost:5173

**默认登录信息**：
- 账号：`admin`
- 密码：`admin123`

---

## 步骤 4: 配置小程序前端

### 4.1 进入 weapp 目录

```bash
cd ../weapp
```

### 4.2 安装依赖

```bash
npm install
```

### 4.3 配置 API 基础 URL

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

### 4.4 开发编译

#### 编译微信小程序

```bash
npm run dev:weapp

# 输出目录：dist/weapp
```

然后用 **微信开发者工具** 打开 `dist/weapp` 目录

#### 编译 H5 Web

```bash
npm run dev:h5

# 访问：http://localhost:10000
```

#### 编译支付宝小程序

```bash
npm run dev:alipay

# 输出目录：dist/alipay
```

---

## 步骤 5: 验证所有服务

### 5.1 后端服务检查

```bash
# 打开新终端
curl http://localhost:8080/api/products

# 应该返回：
# {"code":0,"message":"success","data":{"items":[]}}
```

### 5.2 后台管理系统

访问 http://localhost:5173

- 输入账号：`admin`
- 输入密码：`admin123`
- 点击登录

✅ 应该看到仪表板首页

### 5.3 小程序预览

微信开发者工具中点击 "预览" 或 "真机调试"

---

## 常见问题

### Q: 数据库连接错误

```bash
# 检查 MySQL 是否运行
mysql -u root -p -e "SELECT VERSION();"

# 检查应用配置中的数据库 URL 和凭证
```

### Q: npm install 超时

```bash
# 更换国内镜像源
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### Q: 端口已被占用

```bash
# 后端（8080）
lsof -i :8080
kill -9 <PID>

# 前端（5173）
lsof -i :5173
kill -9 <PID>
```

### Q: 小程序报 404 错误

- 检查 `.env.local` 中的 API 地址是否正确
- 确认后端服务已启动
- 检查小程序的网络请求权限

---

## 下一步

- 📖 阅读 [API 文档](./API.md)
- 📊 学习 [数据库设计](./DATABASE.md)
- 🏗️ 了解 [架构设计](./ARCHITECTURE.md)
- 🚀 查看 [部署指南](./DEPLOYMENT.md)

---

## 需要帮助？

- 📧 提交 [Issue](https://github.com/gexueqiang1226/mall-system/issues)
- 💬 查看 [讨论区](https://github.com/gexueqiang1226/mall-system/discussions)
