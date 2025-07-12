import jwt from 'jsonwebtoken'

import { config } from './config'
import { users } from './db/user'

export const getUser = async (token: string | null | undefined) => {
	if (!token) return { user: null }

	try {
		const decodedToken = jwt.verify(token.split(' ')[1], config.JWT_SECRET)

		const user = users.find(
			(user) => user.id === (decodedToken as { id: string }).id,
		)

		return {
			user,
		}
	} catch (_err) {
		return { user: null }
	}
}

export const generateToken = (id: string) => {
	return jwt.sign({ id }, config.JWT_SECRET)
}
