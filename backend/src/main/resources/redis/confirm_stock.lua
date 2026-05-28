-- confirm_stock.lua
-- KEYS[1] = lockKey
-- ARGV[1] = qty
local lockKey = KEYS[1]
local qty = tonumber(ARGV[1])
local locked = tonumber(redis.call('GET', lockKey) or '0')
if locked >= qty then
  redis.call('DECRBY', lockKey, qty)
  return 1
else
  return 0
end
