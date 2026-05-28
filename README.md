# 🛍️ Mall System - 多端电商商城系统

> 一个支持**微信小程序、字节小程序、支付宝小程序、H5 Web** 的完整代购商城系统，配套专业后台管理系统，支持**实时库存管理、商品动态配置、订单全流程**等核心功能。

## 🎯 项目特色

- ✅ **跨端支持** - 一套代码编译到微信、字节、支付宝小程序及H5
- ✅ **库存管理** - 实时库存同步，支持多仓库库存配置
- ✅ **后台配置** - 可视化后台随时上下线商品、调整库存、查看销售数据
- ✅ **秒杀防护** - 库存锁定机制，防止超卖
- ✅ **订单管理** - 完整的订单生命周期管理
- ✅ **支付集成** - 支持微信支付、支付宝等主流支付方案
- ✅ **响应式设计** - 完美适配各种屏幕尺寸

## 📊 技术栈

### 后端
```yaml
Java 11+
Spring Boot 3.x
Spring Data JPA
MyBatis-Plus
MySQL 8.0+
Redis 6.0+
Docker & Docker Compose
```

### 小程序前端
```yaml
Taro 3.x
React 18
TypeScript
TailwindCSS
Target: WeChat / ByteDance / Alipay / H5
```

### 后台管理
```yaml
Vue 3
TypeScript
Vite
Element Plus
Echarts
```

## 🚀 快速开始

### 前置要求
```bash
# 系统要求
- Java 11+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+
- Docker (可选)
```

### 本地开发

#### 1. 克隆项目
```bash
git clone https://github.com/gexueqiang1226/mall-system.git
cd mall-system
```

#### 2. 后端启动
```bash
cd backend

# 修改数据库配置
vi src/main/resources/application-dev.yml

# 初始化数据库
mysql -u root -p < src/main/resources/db/init.sql

# 启动应用
mvn clean install
mvn spring-boot:run

# API 文档访问
http://localhost:8080/swagger-ui.html
```

#### 3. 后台管理启动
```bash
cd admin

# 安装依赖
npm install

# 开发服务
npm run dev

# 访问
http://localhost:5173
```

#### 4. 小程序前端启动
```bash
cd weapp

# 安装依赖
npm install

# 开发编译（微信小程序）
npm run dev:weapp

# 开发编译（H5）
npm run dev:h5
```

## 📁 项目结构

```
mall-system/
├── backend/                  # Spring Boot 后端服务
│   ├── src/main/java/com/mall/
│   │   ├── product/         # 商品模块
│   │   ├── inventory/       # 库存模块
│   │   ├── order/           # 订单模块
│   │   ├── admin/           # 后台管理
│   │   └── common/          # 通用工具
│   └── pom.xml
├── admin/                    # Vue 3 后台管理系统
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   ├── api/             # 接口调用
│   │   └── router/          # 路由配置
│   └── package.json
├── weapp/                    # Taro 小程序前端
│   ├── src/
│   │   ├── pages/           # 页面
│   │   ├── services/        # 服务
│   │   └── components/      # 组件
│   ├── config/              # Taro 配置
│   └── package.json
├── docs/                     # 项目文档
│   ├── API.md               # API 文档
│   ├── DATABASE.md          # 数据库设计
│   └── DEPLOYMENT.md        # 部署指南
└── docker-compose.yml        # Docker 编排
```

## 📖 核心功能模块

### 1. 商品管理
- 商品信息维护（名称、描述、图片、价格）
- 商品分类管理
- 商品上/下架控制
- 商品推荐配置
- 批量操作

### 2. 库存管理
- 实时库存同步
- 库存预警提醒
- 库存操作日志
- 销售数据统计
- 库存锁定机制（防超卖）

### 3. 订单管理
- 订单创建
- 订单支付
- 订单发货
- 订单退货
- 订单查询统计

### 4. 用户管理
- 用户注册登录
- 个人信息管理
- 地址簿管理
- 收藏夹管理
- 浏览历史记录

### 5. 支付集成
- 微信支付
- 支付宝支付
- 余额支付
- 订单状态同步

## 🔐 API 接口示例

### 获取商品列表
```bash
GET /api/products?page=1&size=20&isOnline=1

Response:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "productName": "iPhone 15 Pro Max",
        "salePrice": 9999,
        "sellableStock": 50,
        "isOnline": 1
      }
    ],
    "total": 100
  }
}
```

### 后台库存配置
```bash
PUT /admin/api/products/1/inventory

Request:
{
  "sellableStock": 100,
  "lowStockWarning": 20,
  "reason": "补货采购"
}

Response:
{
  "code": 0,
  "message": "库存配置成功",
  "data": null
}
```

详细 API 文档见 [docs/API.md](./docs/API.md)

## 🐳 Docker 部署

```bash
# 一键启动所有服务
docker-compose up -d

# 后端服务：http://localhost:8080
# 后台管理：http://localhost:5173
# MySQL：localhost:3306
# Redis：localhost:6379

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

## 📱 小程序使用指南

### 微信小程序
1. 使用微信开发者工具打开 `weapp` 目录
2. 配置 AppID
3. 点击编译

### 支付宝小程序
```bash
npm run dev:alipay
```

### H5 Web
```bash
npm run dev:h5
# 访问：http://localhost:10000
```

## 🎨 后台管理使用

### 登录
- 默认账号：`admin`
- 默认密码：`admin123`

### 主要功能
1. **仪表板** - 实时销售数据、库存预警
2. **商品管理** - 新增/编辑/上下架商品
3. **库存管理** - 库存配置、库存日志查询
4. **订单管理** - 订单查询、发货、退货处理
5. **用户管理** - 用户信息、积分管理
6. **数据统计** - 销售报表、库存报表

## 📊 数据库设计

核心表结构：
- `mall_product` - 商品表
- `mall_inventory_log` - 库存日志表
- `mall_order` - 订单表
- `mall_order_item` - 订单项目表
- `mall_user` - 用户表
- `mall_category` - 分类表

详见 [docs/DATABASE.md](./docs/DATABASE.md)

## 🚄 性能优化

- ✅ Redis 缓存热点数据
- ✅ 数据库查询索引优化
- ✅ 消息队列异步处理
- ✅ CDN 加速静态资源
- ✅ 库存锁定防超卖

## 🔒 安全特性

- ✅ JWT Token 认证
- ✅ 请求签名验证
- ✅ SQL 注入防护
- ✅ CSRF 防护
- ✅ 敏感数据加密
- ✅ API 速率限制

## 📚 文档

- [快速开始指南](./docs/QUICK_START.md)
- [API 文档](./docs/API.md)
- [数据库设计](./docs/DATABASE.md)
- [架构设计](./docs/ARCHITECTURE.md)
- [部署指南](./docs/DEPLOYMENT.md)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 💬 联系方式

- GitHub Issues: [提交问题](https://github.com/gexueqiang1226/mall-system/issues)
- 邮件: gexueqiang1226@gmail.com
- 微信: gexueqiang1226

## 🙏 致谢

感谢所有贡献者的支持！

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
