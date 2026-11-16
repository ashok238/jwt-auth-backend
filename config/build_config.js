const APP_ENVS = ['development', 'test', 'staging', 'production']

const DEFAULTS = {
    development: { authRateLimit: 1000, logFormat: 'dev', exposeErrors: true },
    test: { authRateLimit: 20, logFormat: null, exposeErrors: false },
    staging: { authRateLimit: 20, logFormat: 'combined', exposeErrors: false },
    production: { authRateLimit: 20, logFormat: 'combined', exposeErrors: false }
}

const toNumber = (value, fallback) => {
    if (value === undefined || value === '') {
        return fallback
    }
    const number = Number(value)
    if (!Number.isFinite(number)) {
        throw new Error(`Expected a number but received "${value}"`)
    }
    return number
}

const buildConfig = (env) => {
    // Unset APP_ENV falls back to production so a misconfigured server never exposes dev behaviour
    const appEnv = env.APP_ENV || 'production'
    if (!APP_ENVS.includes(appEnv)) {
        throw new Error(`Invalid APP_ENV "${appEnv}". Expected one of: ${APP_ENVS.join(', ')}`)
    }

    const missing = ['JWT_SECRET', 'MONGODB_URI'].filter((name) => !env[name])
    if (missing.length) {
        throw new Error(`Missing required environment variables for "${appEnv}": ${missing.join(', ')}`)
    }

    const defaults = DEFAULTS[appEnv]

    const obj = Object.freeze({
        appEnv,
        port: toNumber(env.PORT, 3000),
        mongodbUri: env.MONGODB_URI,
        jwtSecret: env.JWT_SECRET,
        jwtExpiresInSeconds: toNumber(env.JWT_EXPIRES_IN_SECONDS, 3600),
        corsOrigin: env.CORS_ORIGIN
            ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
            : '*',
        trustProxy: toNumber(env.TRUST_PROXY, 0),
        authRateLimit: toNumber(env.AUTH_RATE_LIMIT, defaults.authRateLimit),
        logFormat: defaults.logFormat,
        exposeErrors: defaults.exposeErrors
    })


    return obj;
}

module.exports = { buildConfig, APP_ENVS }
