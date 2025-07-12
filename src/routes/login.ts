import { generateToken } from '../auth'
import { users } from '../db/user'
import { router } from '../router'

interface ILoginBody {
	email: string
}

router.post('/login', async (ctx, next) => {
	const { email } = <ILoginBody>ctx.request.body

	const user = users.find((user) => user.email === email)

	if (!user) {
		ctx.status = 401
		ctx.body = { message: 'Invalid email' }
		return
	}

	const token = generateToken(user.id)

	ctx.body = {
		token,
	}

	await next()
})

export default router
