-- 为已存在的数据库添加商品标签字段
-- 执行前请确保已连接到 mall_system 数据库

USE mall_system;

-- 添加新品首发标签字段
ALTER TABLE mall_product ADD COLUMN is_new TINYINT DEFAULT 0 COMMENT '新品首发 0否1是' AFTER recommend_weight;

-- 添加限时秒杀标签字段
ALTER TABLE mall_product ADD COLUMN is_seckill TINYINT DEFAULT 0 COMMENT '限时秒杀 0否1是' AFTER is_new;

-- 为新字段添加索引以提升查询性能
ALTER TABLE mall_product ADD INDEX idx_is_new(is_new);
ALTER TABLE mall_product ADD INDEX idx_is_seckill(is_seckill);

-- 添加视频URL字段
ALTER TABLE mall_product ADD COLUMN video_url VARCHAR(500) DEFAULT NULL COMMENT '商品视频URL' AFTER detail_images;
