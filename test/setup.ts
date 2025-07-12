import { redis } from '../src/lib/redis'

beforeEach(async () => {
	await redis.flushall()
})
