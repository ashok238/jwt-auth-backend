jest.mock('../models/user_model')
jest.mock('bcrypt')

const request = require('supertest')
const User = require('../models/user_model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = require('../app')

beforeEach(() => jest.resetAllMocks())

test('POST /signup 400 without body fields', async () => {
    const res = await request(app).post('/signup').send({})
    expect(res.status).toBe(400)
})

test('POST /signup 201', async () => {
    User.findOne.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('h')
    const res = await request(app).post('/signup').send({ username: 'a', password: 'password1' })
    expect(res.status).toBe(201)
})

test('POST /login returns verifiable, expiring token with userId', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1', username: 'a', password: 'h' })
    bcrypt.compare.mockResolvedValue(true)
    const res = await request(app).post('/login').send({ username: 'a', password: 'p' })
    expect(res.status).toBe(200)
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(payload).toMatchObject({ userId: 'u1', username: 'a' })
    expect(payload.exp - payload.iat).toBe(3600)
})

test('GET /me 401 without token', async () => {
    const res = await request(app).get('/me')
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Authentication failed')
})

test('GET /me 200 with valid token', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'u1', username: 'a' }) })
    const token = jwt.sign({ userId: 'u1', username: 'a' }, process.env.JWT_SECRET)
    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ userId: 'u1', username: 'a' })
})

test('unknown route returns JSON 404', async () => {
    const res = await request(app).get('/nope')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Route not found')
})

test('malformed JSON body returns 400', async () => {
    const res = await request(app).post('/login').set('Content-Type', 'application/json').send('{bad')
    expect(res.status).toBe(400)
})

test('database error returns 500 via error handler', async () => {
    User.findOne.mockRejectedValue(new Error('db down'))
    const res = await request(app).post('/login').send({ username: 'a', password: 'p' })
    expect(res.status).toBe(500)
    expect(res.body.message).toBe('db down')
})

test('sends CORS and security headers', async () => {
    const res = await request(app).post('/login').send({})
    expect(res.headers['access-control-allow-origin']).toBe('*')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
})

// Runs last because it exhausts the shared auth rate limit
test('auth routes are rate limited', async () => {
    const statuses = []
    for (let i = 0; i < 21; i++) {
        statuses.push((await request(app).post('/login').send({})).status)
    }
    expect(statuses).toContain(429)
})
