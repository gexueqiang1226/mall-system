-- 创建数据库
CREATE DATABASE IF NOT EXISTS mall_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mall_system;

-- 商品表
CREATE TABLE IF NOT EXISTS mall_product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL COMMENT '商品名称',
    product_code VARCHAR(100) UNIQUE NOT NULL COMMENT '商品编码',
    category_id BIGINT COMMENT '分类ID',
    description TEXT COMMENT '商品描述',
    main_image VARCHAR(500) COMMENT '主图URL',
    detail_images JSON COMMENT '详情图片',
    sale_price DECIMAL(10, 2) NOT NULL COMMENT '售价',
    market_price DECIMAL(10, 2) COMMENT '市场价',
    cost_price DECIMAL(10, 2) COMMENT '成本价',
    total_stock INT DEFAULT 0 COMMENT '总库存',
    sellable_stock INT DEFAULT 0 COMMENT '可销售库存',
    locked_stock INT DEFAULT 0 COMMENT '锁定库存',
    sold_count INT DEFAULT 0 COMMENT '已销售数',
    low_stock_warning INT DEFAULT 20 COMMENT '库存预警值',
    is_online TINYINT DEFAULT 0 COMMENT '是否上架',
    online_time DATETIME COMMENT '上架时间',
    offline_time DATETIME COMMENT '下架时间',
    is_recommend TINYINT DEFAULT 0 COMMENT '是否推荐',
    recommend_weight INT DEFAULT 0 COMMENT '推荐权重',
    status TINYINT DEFAULT 0 COMMENT '状态(0草稿 1审核 2发布 3下架 4删除)',
    audit_remark VARCHAR(500) COMMENT '审核备注',
    can_return TINYINT DEFAULT 1 COMMENT '是否支持退货',
    return_days INT DEFAULT 30 COMMENT '退货天数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    creator VARCHAR(50) COMMENT '创建人',
    updater VARCHAR(50) COMMENT '更新人',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记',
    KEY idx_category(category_id),
    KEY idx_is_online(is_online),
    KEY idx_status(status),
    KEY idx_create_time(create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 库存日志表
CREATE TABLE IF NOT EXISTS mall_inventory_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL COMMENT '商品ID',
    order_id BIGINT COMMENT '订单ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    quantity_change INT NOT NULL COMMENT '变化数量',
    reason VARCHAR(255) COMMENT '操作原因',
    stock_before INT COMMENT '操作前库存',
    stock_after INT COMMENT '操作后库存',
    operator_id BIGINT COMMENT '操作人ID',
    operate_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    KEY idx_product(product_id),
    KEY idx_order(order_id),
    KEY idx_operate_time(operate_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存操作日志表';

-- 订单表
CREATE TABLE IF NOT EXISTS mall_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '总金额',
    pay_amount DECIMAL(10, 2) COMMENT '实付金额',
    shipping_amount DECIMAL(10, 2) COMMENT '运费',
    discount_amount DECIMAL(10, 2) COMMENT '优惠金额',
    status TINYINT DEFAULT 0 COMMENT '订单状态(0待支付 1已支付 2已发货 3已收货 4已取消 5已退货)',
    payment_method VARCHAR(50) COMMENT '支付方式',
    payment_time DATETIME COMMENT '支付时间',
    shipping_time DATETIME COMMENT '发货时间',
    receive_time DATETIME COMMENT '收货时间',
    remark VARCHAR(500) COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记',
    KEY idx_user(user_id),
    KEY idx_status(status),
    KEY idx_create_time(create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 订单项目表
CREATE TABLE IF NOT EXISTS mall_order_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(255) COMMENT '商品名称',
    quantity INT NOT NULL COMMENT '数量',
    price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    total_amount DECIMAL(10, 2) COMMENT '小计',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_order(order_id),
    KEY idx_product(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单项目表';

-- 用户表
CREATE TABLE IF NOT EXISTS mall_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    phone VARCHAR(20) COMMENT '电话',
    email VARCHAR(100) COMMENT '邮箱',
    avatar VARCHAR(500) COMMENT '头像',
    status TINYINT DEFAULT 1 COMMENT '状态(0禁用 1启用)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记',
    KEY idx_username(username),
    KEY idx_phone(phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 分类表
CREATE TABLE IF NOT EXISTS mall_category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL COMMENT '分类名',
    parent_id BIGINT DEFAULT 0 COMMENT '父分类ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_parent(parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- 管理员表
CREATE TABLE IF NOT EXISTS mall_admin (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) COMMENT '真实姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    role VARCHAR(50) DEFAULT 'admin' COMMENT '角色',
    status TINYINT DEFAULT 1 COMMENT '状态(0禁用 1启用)',
    last_login_time DATETIME COMMENT '最后登录时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_username(username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 初始化数据
INSERT INTO mall_admin (username, password, real_name, email, role) VALUES
('admin', '$2a$10$SIzITvjVk7nCqQeu6zbc5.ayc0zmjT08Bmylt6rUNq8Yb0rMscXPa', '超级管理员', 'admin@mall.com', 'super_admin');

INSERT INTO mall_category (category_name, parent_id, sort_order) VALUES
('电子产品', 0, 1),
('服装鞋帽', 0, 2),
('美妆护肤', 0, 3),
('食品饮料', 0, 4),
('家居生活', 0, 5);

-- 初始化示例商品
INSERT INTO mall_product (
    product_name, product_code, category_id, sale_price, cost_price, total_stock,
    sellable_stock, is_online, status, description, main_image, detail_images
) VALUES
('iPhone 15 Pro Max', 'SKU-001', 1, 9999.00, 5000.00, 100, 100, 1, 2, 'Apple 最新旗舰机', 'https://picsum.photos/400/400?random=1', '["https://picsum.photos/400/400?random=11","https://picsum.photos/400/400?random=12"]'),
('MacBook Pro M3', 'SKU-002', 1, 12999.00, 6500.00, 50, 50, 1, 2, '专业级笔记本电脑', 'https://picsum.photos/400/400?random=2', '["https://picsum.photos/400/400?random=21","https://picsum.photos/400/400?random=22"]'),
('Samsung Galaxy S24', 'SKU-003', 1, 6999.00, 3500.00, 80, 80, 1, 2, '安卓旗舰手机', 'https://picsum.photos/400/400?random=3', '["https://picsum.photos/400/400?random=31","https://picsum.photos/400/400?random=32"]'),
('Nike Air Max', 'SKU-004', 2, 899.00, 450.00, 200, 200, 1, 2, '经典运动鞋', 'https://picsum.photos/400/400?random=4', '["https://picsum.photos/400/400?random=41","https://picsum.photos/400/400?random=42"]'),
('SK-II 神仙水', 'SKU-005', 3, 1599.00, 800.00, 150, 150, 1, 2, '护肤精华', 'https://picsum.photos/400/400?random=5', '["https://picsum.photos/400/400?random=51","https://picsum.photos/400/400?random=52"]');

-- =============================================
-- 收货地址表
-- =============================================
CREATE TABLE IF NOT EXISTS mall_address (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    receiver VARCHAR(50) NOT NULL COMMENT '收货人',
    phone VARCHAR(20) NOT NULL COMMENT '手机号',
    province VARCHAR(50) COMMENT '省',
    city VARCHAR(50) COMMENT '市',
    district VARCHAR(50) COMMENT '区',
    detail VARCHAR(255) COMMENT '详细地址',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认地址(0否 1是)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记',
    KEY idx_user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表';

-- =============================================
-- 优惠券表
-- =============================================
CREATE TABLE IF NOT EXISTS mall_coupon (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    title VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    type TINYINT NOT NULL COMMENT '类型(1满减 2折扣 3无门槛)',
    discount_value DECIMAL(10, 2) NOT NULL COMMENT '优惠值',
    min_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '最低消费金额',
    start_time DATETIME COMMENT '生效时间',
    end_time DATETIME COMMENT '过期时间',
    status TINYINT DEFAULT 0 COMMENT '状态(0未使用 1已使用 2已过期)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记',
    KEY idx_user(user_id),
    KEY idx_status(status),
    KEY idx_end_time(end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券表';

-- =============================================
-- 收藏表
-- =============================================
CREATE TABLE IF NOT EXISTS mall_favorite (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记',
    UNIQUE KEY uk_user_product(user_id, product_id),
    KEY idx_user(user_id),
    KEY idx_product(product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- =============================================
-- 积分记录表
-- =============================================
CREATE TABLE IF NOT EXISTS mall_points (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    points INT NOT NULL COMMENT '积分变动值(正负)',
    type VARCHAR(50) NOT NULL COMMENT '类型(earn消费获得/redeem兑换/admin管理员调整)',
    order_id BIGINT COMMENT '关联订单ID',
    description VARCHAR(500) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记',
    KEY idx_user(user_id),
    KEY idx_order(order_id),
    KEY idx_type(type),
    KEY idx_create_time(create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分记录表';

-- =============================================
-- 商品评价表
-- =============================================
CREATE TABLE IF NOT EXISTS mall_review (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    order_id BIGINT COMMENT '订单ID',
    rating INT NOT NULL COMMENT '评分(1-5星)',
    content TEXT COMMENT '评价内容',
    images VARCHAR(2000) COMMENT '图片URL列表(逗号分隔)',
    reply TEXT COMMENT '商家回复',
    reply_time DATETIME COMMENT '回复时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记',
    KEY idx_user(user_id),
    KEY idx_product(product_id),
    KEY idx_order(order_id),
    KEY idx_rating(rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品评价表';

-- 用户表增加积分字段
ALTER TABLE mall_user ADD COLUMN points BIGINT DEFAULT 0 COMMENT '用户积分' AFTER status;
