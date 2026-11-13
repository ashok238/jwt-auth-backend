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
    const res = await request(app).post('/signup').send({ username: 'a', password: 'p' })
    expect(res.status).toBe(201)
})

test('POST /login returns verifiable token', async () => {
    User.findOne.mockResolvedValue({ username: 'a', password: 'h' })
    bcrypt.compare.mockResolvedValue(true)
    const res = await request(app).post('/login').send({ username: 'a', password: 'p' })
    expect(res.status).toBe(200)
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET).username).toBe('a')
})

test('database error returns 500 via error handler', async () => {
    User.findOne.mockRejectedValue(new Error('db down'))
    const res = await request(app).post('/login').send({ username: 'a', password: 'p' })
    expect(res.status).toBe(500)
    expect(res.body.message).toBe('db down')
})

test('sends CORS header', async () => {
    const res = await request(app).post('/login').send({})
    expect(res.headers['access-control-allow-origin']).toBe('*')
})
