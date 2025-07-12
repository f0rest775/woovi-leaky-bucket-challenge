import path from 'node:path'

import dotenvSafe from 'dotenv-safe'

const cwd = process.cwd()

const root = path.join.bind(cwd)

dotenvSafe.config({
	path: root('.env'),
	sample: root('.env.example'),
})

const ENV = process.env

const config = {
	PORT: ENV.PORT ?? 3333,
	NODE_ENV: ENV.NODE_ENV ?? 'development',
	JWT_SECRET: ENV.JWT_SECRET || 'secret_key',
	REDIS_URL: ENV.REDIS_URL || 'redis://:redis@localhost:6379',
}

export { config }
