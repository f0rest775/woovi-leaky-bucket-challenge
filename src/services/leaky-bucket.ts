import { redis } from '../lib/redis'

export interface ILeakyBucket {
	success: boolean
	tokens: number
	lastRefill: Date
}

export const MAX_TOKENS = 10
export const REFILL_RATE_PER_HOUR = 1
export const REFILL_INTERVAL_MS = (60 * 60 * 1000) / REFILL_RATE_PER_HOUR

const PRE_CONSUME_LUA_SCRIPT = `
		local key = KEYS[1]
		local max_tokens = tonumber(ARGV[1])
		local refill_interval_ms = tonumber(ARGV[2])
		local now = tonumber(ARGV[3])
		local cost = tonumber(ARGV[4])

		local bucket_data = redis.call('HMGET', key, 'tokens', 'lastRefill')
		local current_tokens = tonumber(bucket_data[1])
		local last_refill_time = tonumber(bucket_data[2])

		if current_tokens == nil then
			current_tokens = max_tokens
			last_refill_time = now
		else
			local time_since_last_refill = now - last_refill_time
			if time_since_last_refill > 0 then
				local tokens_to_add = math.floor(time_since_last_refill / refill_interval_ms)
				if tokens_to_add > 0 then
					current_tokens = math.min(current_tokens + tokens_to_add, max_tokens)
					last_refill_time = last_refill_time + (tokens_to_add * refill_interval_ms)
				end
			end
		end

		local allowed = 0
		if current_tokens >= cost then
			current_tokens = current_tokens - cost
			allowed = 1
		end

		redis.call('HMSET', key, 'tokens', current_tokens, 'lastRefill', last_refill_time)
		local expire_seconds = math.ceil((max_tokens * refill_interval_ms) / 1000 * 2)
		redis.call('EXPIRE', key, expire_seconds)

		return { allowed, current_tokens, last_refill_time }
	`

export async function preConsumeToken(userId: string): Promise<ILeakyBucket> {
	const key = `leakyBucket:${userId}`
	const now = Date.now()
	const cost = 1

	const result = (await redis.eval(
		PRE_CONSUME_LUA_SCRIPT,
		1,
		key,
		MAX_TOKENS,
		REFILL_INTERVAL_MS,
		now,
		cost,
	)) as [number, number, number]

	return {
		success: result[0] === 1,
		tokens: result[1],
		lastRefill: new Date(result[2]),
	}
}

const REFUND_AND_GET_BUCKET_LUA_SCRIPT = `
  local key = KEYS[1]
  local max_tokens = tonumber(ARGV[1])
  
  local current_tokens = tonumber(redis.call('HGET', key, 'tokens'))
  
  if current_tokens and current_tokens < max_tokens then
    current_tokens = redis.call('HINCRBY', key, 'tokens', 1)
  end
  
  local last_refill_time = tonumber(redis.call('HGET', key, 'lastRefill'))
  
  return { 1, current_tokens, last_refill_time }
`

export async function refundToken(userId: string): Promise<ILeakyBucket> {
	const key = `leakyBucket:${userId}`

	const result = (await redis.eval(
		REFUND_AND_GET_BUCKET_LUA_SCRIPT,
		1,
		key,
		MAX_TOKENS,
	)) as [number, number, number]

	const [sucess, tokens, lastRefillTime] = result

	return {
		success: sucess === 1,
		tokens: tokens,
		lastRefill: new Date(lastRefillTime),
	}
}
