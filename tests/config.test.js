const { buildConfig } = require('../config/build_config')

const required = { JWT_SECRET: 's', MONGODB_URI: 'mongodb://x' }

test('defaults to production when APP_ENV is unset', () => {
    const config = buildConfig(required)
    expect(config.appEnv).toBe('production')
    expect(config.exposeErrors).toBe(false)
})

test('rejects an unknown APP_ENV', () => {
    expect(() => buildConfig({ ...required, APP_ENV: 'prod' })).toThrow('Invalid APP_ENV "prod"')
})

test('lists all missing required variables', () => {
    expect(() => buildConfig({ APP_ENV: 'staging' }))
        .toThrow('Missing required environment variables for "staging": JWT_SECRET, MONGODB_URI')
})

test.each([
    ['development', { exposeErrors: true, authRateLimit: 1000, logFormat: 'dev' }],
    ['test', { exposeErrors: false, authRateLimit: 20, logFormat: null }],
    ['staging', { exposeErrors: false, authRateLimit: 20, logFormat: 'combined' }],
    ['production', { exposeErrors: false, authRateLimit: 20, logFormat: 'combined' }],
])('%s defaults', (APP_ENV, expected) => {
    expect(buildConfig({ ...required, APP_ENV })).toMatchObject(expected)
})

test('explicit variables override defaults', () => {
    const config = buildConfig({
        ...required,
        APP_ENV: 'production',
        PORT: '8080',
        AUTH_RATE_LIMIT: '5',
        TRUST_PROXY: '1',
        CORS_ORIGIN: 'https://a.com, https://b.com'
    })
    expect(config).toMatchObject({
        port: 8080,
        authRateLimit: 5,
        trustProxy: 1,
        corsOrigin: ['https://a.com', 'https://b.com']
    })
})

test('rejects non-numeric numeric settings', () => {
    expect(() => buildConfig({ ...required, JWT_EXPIRES_IN_SECONDS: '1h' })).toThrow('Expected a number but received "1h"')
})
