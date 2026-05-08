-- unlock_stock.lua
-- KEYS[1] = stockKey
-- KEYS[2] = lockKey
-- ARGV[1] = qty
local stockKey = KEYS[1]
local lockKey = KEYS[2]
local qty = tonumber(ARGV[1])
local locked = tonumber(redis.call('GET', lockKey) or '0')
if locked >= qty then
  redis.call('DECRBY', lockKey, qty)
  redis.call('INCRBY', stockKey, qty)
  return 1
else
  return 0
end
