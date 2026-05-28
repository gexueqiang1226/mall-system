# 📊 数据库设计

## ER 图

```
┌──────────────────────┐
│   mall_product       │
├──────────────────────┤
│ id (PK)              │
│ product_name         │
│ product_code (UQ)    │
│ category_id (FK)     │
│ sale_price           │
│ cost_price           │
│ total_stock          │
│ sellable_stock       │──┐
│ locked_stock         │  │
│ is_online            │  │
│ status               │  │
└──────────────────────┘  │
                          │
                    ┌─────▼──────────────────┐
                    │  mall_inventory_log    │
                    ├────────────────────────┤
                    │ id (PK)                │
                    │ product_id (FK)        │
                    │ order_id (FK)          │
                    │ operation_type         │
                    │ quantity_change        │
                    │ stock_before           │
                    │ stock_after            │
                    │ operate_time           │
                    └────────────────────────┘
```

## 表结构详解

### 1. mall_product（商品表）

核心电商表，存储商品的所有信息。

```sql
CREATE TABLE mall_product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL COMMENT '商品名称',
    product_code VARCHAR(100) UNIQUE NOT NULL COMMENT '商品编码(SKU)',
    category_id BIGINT COMMENT '分类ID',
    
    -- 价格字段
    sale_price DECIMAL(10, 2) NOT NULL COMMENT '售价',
    market_price DECIMAL(10, 2) COMMENT '市场价（原价）',
    cost_price DECIMAL(10, 2) COMMENT '成本价（进货价）',
    
    -- 库存字段（核心）
    total_stock INT DEFAULT 0 COMMENT '总库存',
    sellable_stock INT DEFAULT 0 COMMENT '可销售库存',
    locked_stock INT DEFAULT 0 COMMENT '锁定库存(已下单未支付)',
    sold_count INT DEFAULT 0 COMMENT '已销售数',
    low_stock_warning INT DEFAULT 20 COMMENT '库存预警值',
    
    -- 上下线状态
    is_online TINYINT DEFAULT 0 COMMENT '是否上架(0/1)',
    online_time DATETIME COMMENT '上架时间',
    offline_time DATETIME COMMENT '下架时间',
    
    -- 其他
    is_recommend TINYINT DEFAULT 0 COMMENT '是否推荐',
    recommend_weight INT DEFAULT 0 COMMENT '推荐权重',
    status TINYINT DEFAULT 0 COMMENT '商品状态',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    KEY idx_category(category_id),
    KEY idx_is_online(is_online),
    KEY idx_status(status),
    KEY idx_create_time(create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';
```

**库存字段说明**：

| 字段名 | 说明 | 初值 | 变化场景 |
|-------|------|------|----------|
| total_stock | 总库存（不变） | 100 | 补货时修改 |
| sellable_stock | 可销售库存 | 100 | 下单时-1，支付时-1，退货时+1 |
| locked_stock | 锁定库存 | 0 | 下单时+1，支付时-1 |
| sold_count | 已销售数 | 0 | 支付成功时+1 |

**状态值**：

```
0 = 草稿
1 = 待审核
2 = 已发布（上架)
3 = 已下架
4 = 已删除（逻辑删除）
```

---

### 2. mall_inventory_log（库存操作日志表）

记录所有库存变动历史，用于追溯和审计。

```sql
CREATE TABLE mall_inventory_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL COMMENT '商品ID',
    order_id BIGINT COMMENT '订单ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    quantity_change INT NOT NULL COMMENT '变化数量(可为负)',
    reason VARCHAR(255) COMMENT '操作原因',
    stock_before INT COMMENT '操作前库存',
    stock_after INT COMMENT '操作后库存',
    operator_id BIGINT COMMENT '操作人ID',
    operate_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    KEY idx_product(product_id),
    KEY idx_order(order_id),
    KEY idx_operate_time(operate_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存操作日志表';
```

**操作类型**：

| 类型 | 说明 | 数量变化 | 触发条件 |
|------|------|---------|----------|
| lock | 锁定库存 | sellable_stock - 1 | 用户下单 |
| unlock | 解锁库存 | sellable_stock + 1 | 订单取消 |
| sold | 扣减库存 | sellable_stock - 1 | 支付成功 |
| return | 返还库存 | sellable_stock + 1 | 退货成功 |
| increase | 增加库存 | sellable_stock + n | 补货采购 |
| decrease | 减少库存 | sellable_stock - n | 损坏处理 |

---

### 3. mall_order（订单表）

```sql
CREATE TABLE mall_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '总金额',
    pay_amount DECIMAL(10, 2) COMMENT '实付金额',
    shipping_amount DECIMAL(10, 2) COMMENT '运费',
    discount_amount DECIMAL(10, 2) COMMENT '优惠金额',
    
    -- 订单状态
    status TINYINT DEFAULT 0 COMMENT '订单状态',
    payment_method VARCHAR(50) COMMENT '支付方式',
    payment_time DATETIME COMMENT '支付时间',
    shipping_time DATETIME COMMENT '发货时间',
    receive_time DATETIME COMMENT '收货时间',
    
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    
    KEY idx_user(user_id),
    KEY idx_status(status),
    KEY idx_create_time(create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
```

**订单状态**：

```
0 = 待支付
1 = 已支付
2 = 已发货
3 = 已收货
4 = 已取消
5 = 已退货
```

---

### 4. mall_order_item（订单项目表）

```sql
CREATE TABLE mall_order_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(255) COMMENT '商品名称（快照）',
    quantity INT NOT NULL COMMENT '数量',
    price DECIMAL(10, 2) NOT NULL COMMENT '单价（快照）',
    total_amount DECIMAL(10, 2) COMMENT '小计',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    KEY idx_order(order_id),
    KEY idx_product(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单项目表';
```

---

### 5. mall_user（用户表）

```sql
CREATE TABLE mall_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    avatar VARCHAR(500) COMMENT '头像URL',
    status TINYINT DEFAULT 1 COMMENT '状态(0禁用 1启用)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    
    KEY idx_username(username),
    KEY idx_phone(phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

---

## 索引策略

### 频繁查询的字段

```sql
-- 商品表
KEY idx_category(category_id)        -- 按分类查询
KEY idx_is_online(is_online)         -- 查询上架商品
KEY idx_status(status)               -- 按状态筛选
KEY idx_create_time(create_time)     -- 按创建时间排序

-- 库存日志
KEY idx_product(product_id)          -- 按商品查询日志
KEY idx_operate_time(operate_time)   -- 按时间查询

-- 订单
KEY idx_user(user_id)                -- 按用户查询订单
KEY idx_status(status)               -- 按订单状态筛选
KEY idx_create_time(create_time)     -- 按创建时间排序
```

---

## 库存流转场景

### 场景 1：正常下单与支付

```sql
-- 1. 用户下单（锁定库存）
UPDATE mall_product SET 
    sellable_stock = sellable_stock - 1,
    locked_stock = locked_stock + 1 
WHERE id = 1;

INSERT INTO mall_inventory_log VALUES
(null, 1, null, 'lock', -1, '下单锁定', 100, 99, 0, NOW());

-- 2. 支付成功（确认销售）
UPDATE mall_product SET 
    locked_stock = locked_stock - 1,
    sold_count = sold_count + 1 
WHERE id = 1;

INSERT INTO mall_inventory_log VALUES
(null, 1, 100, 'sold', -1, '支付成功', 99, 99, 0, NOW());
```

### 场景 2：订单取消

```sql
-- 订单取消（解锁库存）
UPDATE mall_product SET 
    sellable_stock = sellable_stock + 1,
    locked_stock = locked_stock - 1 
WHERE id = 1;

INSERT INTO mall_inventory_log VALUES
(null, 1, 100, 'unlock', 1, '订单取消', 99, 100, 0, NOW());
```

### 场景 3：商品退货

```sql
-- 退货成功（返还库存）
UPDATE mall_product SET 
    sellable_stock = sellable_stock + 1,
    sold_count = sold_count - 1 
WHERE id = 1;

INSERT INTO mall_inventory_log VALUES
(null, 1, 100, 'return', 1, '退货成功', 99, 100, 0, NOW());
```

### 场景 4：后台补货

```sql
-- 补货采购
UPDATE mall_product SET 
    total_stock = total_stock + 50,
    sellable_stock = sellable_stock + 50 
WHERE id = 1;

INSERT INTO mall_inventory_log VALUES
(null, 1, null, 'increase', 50, '补货采购', 100, 150, 1, NOW());
```

---

## 查询优化

### 获取库存充足的商品

```sql
SELECT * FROM mall_product 
WHERE is_online = 1 
  AND sellable_stock > 0 
  AND status = 2
ORDER BY recommend_weight DESC, create_time DESC
LIMIT 20;
```

### 获取库存预警的商品

```sql
SELECT id, product_name, sellable_stock, low_stock_warning
FROM mall_product 
WHERE sellable_stock <= low_stock_warning 
  AND is_online = 1
ORDER BY sellable_stock ASC;
```

### 查询库存操作历史

```sql
SELECT * FROM mall_inventory_log 
WHERE product_id = 1 
ORDER BY operate_time DESC 
LIMIT 100;
```

---

## 性能考虑

1. **库存表分区**（可选，当数据量超过1千万）
   ```sql
   PARTITION BY RANGE (YEAR(create_time))
   ```

2. **缓存策略**
   - Redis 缓存商品库存（实时）
   - 缓存失效时更新数据库

3. **异步处理**
   - 库存日志异步写入（消息队列）
   - 库存预警异步通知

4. **定期归档**
   - 库存日志每月归档
   - 超过 3 个月的日志移到冷表
