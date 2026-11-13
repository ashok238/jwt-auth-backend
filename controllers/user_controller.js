const User = require('../models/user_model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const signup = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' })
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
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' })
    }

    const user = await User.findOne({ username })

    if (!user) {
        return res.status(404).json({ message: 'username not found' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return res.status(401).json({ message: 'password incorrect' })
    }

    const token = jwt.sign(
        {
            username: user.username
        },
        process.env.JWT_SECRET
    )

    res.json({
        message: "Login successful",
        token
    })
};

module.exports = { signup, login };
