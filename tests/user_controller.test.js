jest.mock('../models/user_model')
jest.mock('bcrypt')
jest.mock('jsonwebtoken')

const User = require('../models/user_model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { signup, login, getMe } = require('../controllers/user_controller')

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

    test('400 when username is not a string (operator injection)', async () => {
        const res = mockRes()
        await signup({ body: { username: { $ne: null }, password: 'password1' } }, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(User.findOne).not.toHaveBeenCalled()
    })

    test('400 when password is too short', async () => {
        const res = mockRes()
        await signup({ body: { username: 'a', password: 'short' } }, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(User.create).not.toHaveBeenCalled()
    })

    test('409 when username exists', async () => {
        User.findOne.mockResolvedValue({ username: 'a' })
        const res = mockRes()
        await signup({ body: { username: 'a', password: 'password1' } }, res)
        expect(res.status).toHaveBeenCalledWith(409)
        expect(User.create).not.toHaveBeenCalled()
    })

    test('201 and stores hashed password with trimmed username', async () => {
        User.findOne.mockResolvedValue(null)
        bcrypt.hash.mockResolvedValue('hashed')
        const res = mockRes()
        await signup({ body: { username: ' a ', password: 'password1' } }, res)
        expect(bcrypt.hash).toHaveBeenCalledWith('password1', 10)
        expect(User.create).toHaveBeenCalledWith({ username: 'a', password: 'hashed' })
        expect(res.status).toHaveBeenCalledWith(201)
    })
})

describe('login', () => {
    const user = { _id: 'u1', username: 'a', password: 'h' }

    test('400 when fields missing', async () => {
        const res = mockRes()
        await login({ body: { password: 'p' } }, res)
        expect(res.status).toHaveBeenCalledWith(400)
    })

    test('400 when password is not a string', async () => {
        const res = mockRes()
        await login({ body: { username: 'a', password: { $gt: '' } } }, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(User.findOne).not.toHaveBeenCalled()
    })

    test('unknown user and wrong password give identical 401 responses', async () => {
        User.findOne.mockResolvedValue(null)
        const unknown = mockRes()
        await login({ body: { username: 'a', password: 'p' } }, unknown)

        User.findOne.mockResolvedValue(user)
        bcrypt.compare.mockResolvedValue(false)
        const wrong = mockRes()
        await login({ body: { username: 'a', password: 'p' } }, wrong)

        expect(unknown.status).toHaveBeenCalledWith(401)
        expect(wrong.status).toHaveBeenCalledWith(401)
        expect(unknown.json.mock.calls[0][0]).toEqual(wrong.json.mock.calls[0][0])
    })

    test('returns token with userId and expiry on success', async () => {
        User.findOne.mockResolvedValue(user)
        bcrypt.compare.mockResolvedValue(true)
        jwt.sign.mockReturnValue('tok')
        const res = mockRes()
        await login({ body: { username: 'a', password: 'p' } }, res)
        expect(jwt.sign).toHaveBeenCalledWith({ userId: 'u1', username: 'a' }, 'test_secret', { expiresIn: 3600 })
        expect(res.json).toHaveBeenCalledWith({
            message: 'Login successful', token: 'tok', userId: 'u1', username: 'a', expiresIn: 3600
        })
    })
})

describe('getMe', () => {
    const query = (result) => ({ select: jest.fn().mockResolvedValue(result) })

    test('returns the current user without password', async () => {
        const q = query({ _id: 'u1', username: 'a' })
        User.findById.mockReturnValue(q)
        const res = mockRes()
        await getMe({ userData: { userId: 'u1' } }, res)
        expect(User.findById).toHaveBeenCalledWith('u1')
        expect(q.select).toHaveBeenCalledWith('-password')
        expect(res.json).toHaveBeenCalledWith({ userId: 'u1', username: 'a' })
    })

    test('401 when user no longer exists', async () => {
        User.findById.mockReturnValue(query(null))
        const res = mockRes()
        await getMe({ userData: { userId: 'u1' } }, res)
        expect(res.status).toHaveBeenCalledWith(401)
    })
})
