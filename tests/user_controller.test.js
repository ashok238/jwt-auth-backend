jest.mock('../models/user_model')
jest.mock('bcrypt')
jest.mock('jsonwebtoken')

const User = require('../models/user_model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { signup, login } = require('../controllers/user_controller')

const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

beforeEach(() => jest.resetAllMocks())

describe('signup', () => {
    test('400 when fields missing', async () => {
        const res = mockRes()
        await signup({ body: { username: 'a' } }, res)
        expect(res.status).toHaveBeenCalledWith(400)
    })

    test('409 when username exists', async () => {
        User.findOne.mockResolvedValue({ username: 'a' })
        const res = mockRes()
        await signup({ body: { username: 'a', password: 'p' } }, res)
        expect(res.status).toHaveBeenCalledWith(409)
        expect(User.create).not.toHaveBeenCalled()
    })

    test('201 and stores hashed password', async () => {
        User.findOne.mockResolvedValue(null)
        bcrypt.hash.mockResolvedValue('hashed')
        const res = mockRes()
        await signup({ body: { username: 'a', password: 'p' } }, res)
        expect(bcrypt.hash).toHaveBeenCalledWith('p', 10)
        expect(User.create).toHaveBeenCalledWith({ username: 'a', password: 'hashed' })
        expect(res.status).toHaveBeenCalledWith(201)
    })
})

describe('login', () => {
    test('400 when fields missing', async () => {
        const res = mockRes()
        await login({ body: { password: 'p' } }, res)
        expect(res.status).toHaveBeenCalledWith(400)
    })

    test('404 when user not found', async () => {
        User.findOne.mockResolvedValue(null)
        const res = mockRes()
        await login({ body: { username: 'a', password: 'p' } }, res)
        expect(res.status).toHaveBeenCalledWith(404)
    })

    test('401 when password wrong', async () => {
        User.findOne.mockResolvedValue({ username: 'a', password: 'h' })
        bcrypt.compare.mockResolvedValue(false)
        const res = mockRes()
        await login({ body: { username: 'a', password: 'p' } }, res)
        expect(res.status).toHaveBeenCalledWith(401)
    })

    test('returns token on success', async () => {
        User.findOne.mockResolvedValue({ username: 'a', password: 'h' })
        bcrypt.compare.mockResolvedValue(true)
        jwt.sign.mockReturnValue('tok')
        const res = mockRes()
        await login({ body: { username: 'a', password: 'p' } }, res)
        expect(jwt.sign).toHaveBeenCalledWith({ username: 'a' }, 'test_secret')
        expect(res.json).toHaveBeenCalledWith({ message: 'Login successful', token: 'tok' })
    })
})
