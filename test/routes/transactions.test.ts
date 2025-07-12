import request from 'supertest'
import app from '../../src/app'
import { generateToken } from '../../src/auth'
import { users } from '../../src/db/user'
import { MAX_TOKENS } from '../../src/services/leaky-bucket'

describe('Transaction Route', () => {
	test('should return 401 if no token is provided', async () => {
		const response = await request(app.callback()).post('/api/transaction')
		expect(response.status).toBe(401)
		expect(response.body.message).toBe('Missing token')
	})

	test('should return 200 for a successful transaction', async () => {
		const userId = users[0].id
		const token = generateToken(userId)
		const pixKey = users[1].pixKey

		const response = await request(app.callback())
			.post('/api/transaction')
			.auth(token, {
				type: 'bearer',
			})
			.send({
				pixKey,
				amount: 1000,
			})

		expect(response.status).toBe(200)
		expect(response.body.message).toBe('Transaction completed successfully.')
		expect(response.body.tokens).toBe(MAX_TOKENS)
	})

	test('should return 404 when sending to own pixKey', async () => {
		const userId = users[0].id
		const token = generateToken(userId)
		const pixKey = users[0].pixKey

		const response = await request(app.callback())
			.post('/api/transaction')
			.auth(token, {
				type: 'bearer',
			})
			.send({
				pixKey,
				amount: 1000,
			})

		expect(response.status).toBe(404)
		expect(response.body.message).toBe('Invalid pixKey.')
		expect(response.body.tokens).toBe(MAX_TOKENS - 1)
	})

	test('should return 404 for an invalid pixKey', async () => {
		const userId = users[1].id
		const token = generateToken(userId)

		const response = await request(app.callback())
			.post('/api/transaction')
			.auth(token, {
				type: 'bearer',
			})
			.send({
				pixKey: 'invalid-pix-key',
				amount: 1000,
			})

		expect(response.status).toBe(404)
		expect(response.body.message).toBe('Invalid pixKey.')
		expect(response.body.tokens).toBe(MAX_TOKENS - 1)
	})

	test('should return 400 if amount exceeds the limit', async () => {
		const userId = users[2].id
		const token = generateToken(userId)
		const pixKey = users[1].pixKey

		const response = await request(app.callback())
			.post('/api/transaction')
			.auth(token, {
				type: 'bearer',
			})
			.send({
				pixKey,
				amount: 100000,
			})

		expect(response.status).toBe(400)
		expect(response.body.message).toBe(
			'The amount exceeds the maximum allowed transaction value.',
		)
		expect(response.body.tokens).toBe(MAX_TOKENS - 1)
	})

	test('should return 429 when request limit is reached', async () => {
		const userId = users[4].id
		const token = generateToken(userId)
		const pixKey = users[4].pixKey

		for (let i = 0; i < MAX_TOKENS; i++) {
			const res = await request(app.callback())
				.post('/api/transaction')
				.auth(token, { type: 'bearer' })
				.send({
					pixKey,
					amount: 1000000,
				})

			expect([200, 400, 404]).toContain(res.status)
		}

		const response = await request(app.callback())
			.post('/api/transaction')
			.auth(token, { type: 'bearer' })
			.send({
				pixKey,
				amount: 1000,
			})

		expect(response.status).toBe(429)
		expect(response.body.message).toBe(
			'You have reached the request limit. Please try again later.',
		)
		expect(response.body.tokens).toBe(0)
	})

	test('should handle concurrent requests without race condition', async () => {
		const userId = users[3].id
		const token = generateToken(userId)
		const pixKey = users[1].pixKey

		const requests = Array.from({ length: 50 }).map(() =>
			request(app.callback())
				.post('/api/transaction')
				.auth(token, { type: 'bearer' })
				.send({ pixKey, amount: 100 }),
		)

		const results = await Promise.allSettled(requests)
		const responses = results
			.filter((r) => r.status === 'fulfilled')
			.map((r) => r.value)

		const successCount = responses.filter((r) => r.status === 200).length
		const limitExceededCount = responses.filter((r) => r.status === 429).length

		expect(successCount).toBeLessThanOrEqual(MAX_TOKENS)
		expect(successCount + limitExceededCount).toBe(50)

		const finalTokenCount = responses[responses.length - 1]?.body?.tokens || 0
		expect(finalTokenCount).toBeLessThanOrEqual(MAX_TOKENS)
	})
})
