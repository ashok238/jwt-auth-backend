const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')

const config = require('./config')
const { version } = require('./package.json')
const userRoutes = require('./routes/user_routes')

const app = express()

// Needed behind a reverse proxy (e.g. Render) so rate limiting sees the real client IP
if (config.trustProxy) {
    app.set('trust proxy', config.trustProxy)
}

app.use(helmet())
app.use(cors({ origin: config.corsOrigin }))
if (config.logFormat) {
    app.use(morgan(config.logFormat))
}
app.use(express.json({ limit: '10kb' }))

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        env: config.appEnv,
        version,
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    })
})

app.use('/', userRoutes)

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' })
})

app.use((err, req, res, next) => {
    const status = [err.status, err.code].find((s) => Number.isInteger(s) && s >= 400 && s < 600) || 500

    if (status >= 500 && config.appEnv !== 'test') {
        console.error(err)
    }

    // Server error details (e.g. database messages) are only returned in development
    const hideDetails = status >= 500 && !config.exposeErrors
    res.status(status).json({
        message: hideDetails ? 'Something went wrong' : err.message || 'Something went wrong',
        ...(config.exposeErrors && { stack: err.stack })
    })
})

module.exports = app
