const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const userRoutes = require('./routes/user_routes')

const app = express()

// Needed behind a reverse proxy (e.g. Render) so rate limiting sees the real client IP
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY))
}

// Comma-separated list of allowed frontend origins; allows all origins when unset
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : '*'

app.use(helmet())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '10kb' }))

app.use('/', userRoutes)

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' })
})

app.use((err, req, res, next) => {
    const status = [err.status, err.code].find((s) => Number.isInteger(s) && s >= 400 && s < 600) || 500
    res.status(status).json({ message: err.message || 'Something went wrong' })
})

module.exports = app
