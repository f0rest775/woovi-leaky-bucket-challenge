import app from './app'
import { config } from './config'

app.listen(config.PORT, () => {
	console.log(`HTTP Server running on port ${config.PORT}`)
	console.log('✅ All routes registered successfully.')
})
