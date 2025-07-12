import {
	type ILeakyBucket,
	MAX_TOKENS,
	preConsumeToken,
	REFILL_INTERVAL_MS,
	refundToken,
} from '../../src/services/leaky-bucket'

beforeAll(() => {
	jest.useFakeTimers()
})

afterAll(() => {
	jest.useRealTimers()
})

describe('Leaky Bucket', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should initialize a new user with the maximum number of tokens', async () => {
		const userId = 'user-1'
		let bucket: ILeakyBucket = await preConsumeToken(userId)
		expect(bucket.success).toBe(true)
		bucket = await refundToken(userId)
		expect(bucket.tokens).toBe(MAX_TOKENS)
	})

	it('should consume one token for a failed request', async () => {
		const userId = 'user-1'
		const bucket: ILeakyBucket = await preConsumeToken(userId)
		expect(bucket.success).toBe(true)
		expect(bucket.tokens).toBe(MAX_TOKENS - 1)
	})

	it('should consume tokens down to zero after multiple failed requests', async () => {
		const userId = 'user-1'

		for (let i = 0; i < MAX_TOKENS; i++) {
			await preConsumeToken(userId)
		}
		const bucket = await preConsumeToken(userId)
		expect(bucket.tokens).toBe(0)
	})

	it('should not allow a request if the user has no tokens', async () => {
		const userId = 'user-1'
		for (let i = 0; i < MAX_TOKENS; i++) {
			await preConsumeToken(userId)
		}

		const bucket: ILeakyBucket = await preConsumeToken(userId)

		expect(bucket.tokens).toBe(0)
	})

	it('should regenerate one token per hour', async () => {
		const userId = 'user-1'
		await preConsumeToken(userId)
		jest.advanceTimersByTime(REFILL_INTERVAL_MS)
		let bucket: ILeakyBucket = await preConsumeToken(userId)
		expect(bucket.success).toBe(true)
		bucket = await refundToken(userId)
		expect(bucket.tokens).toBe(MAX_TOKENS)
	})

	it('should not exceed the maximum number of tokens', async () => {
		const userId = 'user-1'
		await preConsumeToken(userId) // 9 tokens
		await refundToken(userId) // 10 tokens
		jest.advanceTimersByTime(REFILL_INTERVAL_MS * 2) // Advance 2 hours
		let bucket: ILeakyBucket = await preConsumeToken(userId)
		expect(bucket.success).toBe(true)
		bucket = await refundToken(userId)
		expect(bucket.tokens).toBe(MAX_TOKENS)
	})

	it('should handle multiple users independently', async () => {
		const userAId = 'user-A'
		const userBId = 'user-B'

		for (let i = 0; i < 3; i++) {
			await preConsumeToken(userAId)
		}

		let bucketA = await preConsumeToken(userAId)
		let bucketB = await preConsumeToken(userBId)
		expect(bucketA.success).toBe(true)
		expect(bucketB.success).toBe(true)

		bucketA = await refundToken(userAId)
		bucketB = await refundToken(userBId)

		expect(bucketA.tokens).toBe(MAX_TOKENS - 3)
		expect(bucketB.tokens).toBe(MAX_TOKENS)
	})
})
