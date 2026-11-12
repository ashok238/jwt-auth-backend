const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

const app = express()

app.use(express.json())
app.use(cors())

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('monogodb connected')
    }).catch((err) => {
        console.log(' mongodb not connected')
    })


const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        }

    }
)

const User = mongoose.model("User", userSchema)

app.post('/signup', async (req, res) => {
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
})

app.post('/login', async (req, res) => {
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
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})
