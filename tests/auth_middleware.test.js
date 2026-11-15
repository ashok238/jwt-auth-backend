const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')
const HttpError = require('../models/error')

const run = (req) => {
    const next = jest.fn()
    auth(req, {}, next)
    return { next, arg: next.mock.calls[0][0] }
}

test('OPTIONS passes through', () => {
    const { next, arg } = run({ method: 'OPTIONS', headers: {} })
    expect(next).toHaveBeenCalledTimes(1)
    expect(arg).toBeUndefined()
})

test('valid token calls next without error and sets userData', () => {
    const token = jwt.sign({ userId: 'u1', username: 'a' }, process.env.JWT_SECRET)
    const req = { method: 'POST', headers: { authorization: `Bearer ${token}` } }
    const { arg } = run(req)
    expect(arg).toBeUndefined()
    expect(req.userData).toEqual({ userId: 'u1', username: 'a' })
})

test.each([
    ['missing header', {}],
    ['malformed header', { authorization: 'Bearer' }],
    ['wrong scheme', { authorization: 'Basic ' + jwt.sign({ userId: 'u1' }, 'test_secret') }],
    ['invalid token', { authorization: 'Bearer nope' }],
    ['wrong secret', { authorization: 'Bearer ' + jwt.sign({ userId: 'u1' }, 'other') }],
    ['expired token', { authorization: 'Bearer ' + jwt.sign({ userId: 'u1' }, 'test_secret', { expiresIn: -10 }) }],
    ['token without userId', { authorization: 'Bearer ' + jwt.sign({ username: 'a' }, 'test_secret') }],
])('%s -> 401 HttpError', (_, headers) => {
    const { arg } = run({ method: 'GET', headers })
    expect(arg).toBeInstanceOf(HttpError)
    expect(arg.message).toBe('Authentication failed')
    expect(arg.code).toBe(401)
})
