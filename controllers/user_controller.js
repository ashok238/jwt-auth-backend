const User = require('../models/user_model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../config')

const MIN_PASSWORD_LENGTH = 8

// Rejects non-string values such as { "$ne": null } to prevent NoSQL operator injection
const readCredentials = (body = {}) => {
    const { username, password } = body
    if (typeof username !== 'string' || typeof password !== 'string') {
        return null
    }
    const trimmed = username.trim()
    if (!trimmed || !password) {
        return null
    }
    return { username: trimmed, password }
}

const signup = async (req, res) => {
    const credentials = readCredentials(req.body)
    if (!credentials) {
        return res.status(400).json({ message: 'username and password are required' })
    }
    const { username, password } = credentials

    if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ message: `password must be at least ${MIN_PASSWORD_LENGTH} characters` })
    }

    const existingUser = await User.findOne({ username })
    if (existingUser) {
        return res.status(409).json({ message: 'username already exists' })
    }

    const hashedpwd = await bcrypt.hash(password, 10)

    await User.create({
        username: username,
        password: hashedpwd
    })

    res.status(201).json({ message: 'user created successfully' })
};

const login = async (req, res) => {
    const credentials = readCredentials(req.body)
    if (!credentials) {
        return res.status(400).json({ message: 'username and password are required' })
    }
    const { username, password } = credentials

    const user = await User.findOne({ username })
    const isMatch = user ? await bcrypt.compare(password, user.password) : false

    // Same response for unknown user and wrong password to avoid username enumeration
    if (!isMatch) {
        return res.status(401).json({ message: 'invalid username or password' })
    }

    const expiresIn = config.jwtExpiresInSeconds
    const token = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        config.jwtSecret,
        { expiresIn }
    )

    res.json({
        message: 'Login successful',
        token,
        userId: user._id.toString(),
        username: user.username,
        expiresIn
    })
};

const getMe = async (req, res) => {
    const user = await User.findById(req.userData.userId).select('-password')
    if (!user) {
        return res.status(401).json({ message: 'Authentication failed' })
    }
    res.json({ userId: user._id.toString(), username: user.username })
};

module.exports = { signup, login, getMe };
