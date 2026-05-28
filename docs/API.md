# 🔌 API 文档

## 基础信息

- **Base URL**: `http://localhost:8080`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token

## 认证

所有需要认证的接口都需要在 HTTP Header 中添加：

```
Authorization: Bearer <token>
```

## 响应格式

所有接口统一返回以下格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

- `code`: 0 表示成功，非 0 表示失败
- `message`: 返回信息
- `data`: 返回数据

## 商品接口

### 获取商品列表

```http
GET /api/products?page=1&size=20&keyword=iPhone&categoryId=1&isOnline=1
```

**参数**：

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页数量，默认 20 |
| keyword | string | 否 | 搜索关键词 |
| categoryId | long | 否 | 分类 ID |
| isOnline | int | 否 | 上架状态(0/1) |

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "productName": "iPhone 15 Pro Max",
        "productCode": "SKU-001",
        "salePrice": 9999.00,
        "marketPrice": 12999.00,
        "sellableStock": 50,
        "isOnline": 1,
        "mainImage": "https://..."
      }
    ],
    "total": 100,
    "page": 1,
    "size": 20
  }
}
```

### 获取商品详情

```http
GET /api/products/{id}
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "productName": "iPhone 15 Pro Max",
    "productCode": "SKU-001",
    "categoryId": 1,
    "description": "Apple 最新旗舰机",
    "mainImage": "https://...",
    "detailImages": ["https://..."],
    "salePrice": 9999.00,
    "marketPrice": 12999.00,
    "costPrice": 5000.00,
    "totalStock": 100,
    "sellableStock": 50,
    "lockedStock": 10,
    "soldCount": 40,
    "lowStockWarning": 20,
    "isOnline": 1,
    "isRecommend": 1
  }
}
```

## 后台管理接口

### 登录

```http
POST /admin/api/login
```

**请求体**：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "adminId": 1,
    "username": "admin",
    "realName": "超级管理员"
  }
}
```

### 获取商品列表（后台）

```http
GET /admin/api/products?page=1&size=20&keyword=iPhone&status=2
```

**参数**：

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| page | int | 否 | 页码 |
| size | int | 否 | 每页数量 |
| keyword | string | 否 | 关键词 |
| status | int | 否 | 商品状态 |
| categoryId | long | 否 | 分类 ID |

### 新增商品

```http
POST /admin/api/products
```

**请求体**：

```json
{
  "productName": "iPhone 15 Pro Max",
  "productCode": "SKU-001",
  "categoryId": 1,
  "salePrice": 9999.00,
  "costPrice": 5000.00,
  "totalStock": 100,
  "description": "Apple 最新旗舰机",
  "status": 0
}
```

### 编辑商品

```http
PUT /admin/api/products/{id}
```

**请求体**：同新增

### 上架商品

```http
POST /admin/api/products/{id}/online
```

**响应**：

```json
{
  "code": 0,
  "message": "商品上架成功"
}
```

### 下架商品

```http
POST /admin/api/products/{id}/offline
```

### 库存配置

```http
PUT /admin/api/products/{id}/inventory
```

**请求体**：

```json
{
  "sellableStock": 100,
  "lowStockWarning": 20,
  "reason": "补货采购"
}
```

**响应**：

```json
{
  "code": 0,
  "message": "库存配置成功"
}
```

### 获取库存日志

```http
GET /admin/api/inventory-logs?productId=1&page=1&size=20
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "productId": 1,
        "operationType": "increase",
        "quantityChange": 50,
        "reason": "补货采购",
        "stockBefore": 50,
        "stockAfter": 100,
        "operateTime": "2026-05-07 10:30:00"
      }
    ],
    "total": 10
  }
}
```

## 订单接口

### 创建订单

```http
POST /api/orders
```

**请求体**：

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "张三",
    "phone": "13800138000",
    "province": "广东",
    "city": "深圳",
    "district": "南山",
    "address": "科技园路 1 号"
  }
}
```

### 获取订单列表

```http
GET /api/orders?page=1&size=20&status=0
```

### 获取订单详情

```http
GET /api/orders/{id}
```

## 错误码

| 错误码 | 说明 |
|-------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或 token 过期） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
| 1001 | 库存不足 |
| 1002 | 商品不存在 |
| 1003 | 订单不存在 |

---

更多接口详情见 Swagger UI：http://localhost:8080/swagger-ui.html
