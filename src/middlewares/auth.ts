import type { Context, Next } from 'koa'
import { getUser } from '../auth'

export async function auth(ctx: Context, next: Next) {
	const authHeader = ctx.headers.authorization

	if (!authHeader) {
		ctx.status = 401
		ctx.body = { message: 'Missing token' }
		return
	}

	const { user } = await getUser(authHeader)

	if (!user) {
		ctx.status = 401
		ctx.body = { message: 'Invalid token' }
		return
	}

	ctx.state.user = user
	await next()
}
