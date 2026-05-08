-- lock_stock.lua
-- KEYS[1] = stockKey
-- KEYS[2] = lockKey
-- ARGV[1] = qty
local stockKey = KEYS[1]
local lockKey = KEYS[2]
local qty = tonumber(ARGV[1])
local curr = tonumber(redis.call('GET', stockKey) or '0')
if curr >= qty then
  redis.call('DECRBY', stockKey, qty)
  redis.call('INCRBY', lockKey, qty)
  return 1
else
  return 0
end
