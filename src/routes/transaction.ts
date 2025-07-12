import { users } from '../db/user'
import { auth } from '../middlewares/auth'
import { router } from '../router'
import {
	type ILeakyBucket,
	preConsumeToken,
	refundToken,
} from '../services/leaky-bucket'

interface ITransactionBody {
	amount: number // in cents
	pixKey: string
}

const MAX_TRANSACTION_VALUE = 10000

router.post('/transaction', auth, async (ctx, next) => {
	const user = ctx.state.user

	let bucket: ILeakyBucket = await preConsumeToken(user.id)

	if (!bucket.success) {
		ctx.status = 429
		ctx.body = {
			message: 'You have reached the request limit. Please try again later.',
			tokens: bucket.tokens,
			lastRefill: bucket.lastRefill,
		}
		return
	}

	const { amount, pixKey } = <ITransactionBody>ctx.request.body

	if (amount > MAX_TRANSACTION_VALUE) {
		ctx.status = 400
		ctx.body = {
			message: 'The amount exceeds the maximum allowed transaction value.',
			tokens: bucket.tokens,
			lastRefill: bucket.lastRefill,
		}
		return
	}

	const recipient = users.find((u) => u.pixKey === pixKey)

	if (!recipient || recipient.id === user.id) {
		ctx.status = 404
		ctx.body = {
			message: 'Invalid pixKey.',
			tokens: bucket.tokens,
			lastRefill: bucket.lastRefill,
		}
		return
	}

	bucket = await refundToken(user.id)

	if (!bucket.success) {
		ctx.status = 500
		ctx.body = {
			message: 'Internal server error.',
		}
		return
	}

	ctx.body = {
		message: 'Transaction completed successfully.',
		tokens: bucket.tokens,
		lastRefill: bucket.lastRefill,
	}

	await next()
})

export default router
