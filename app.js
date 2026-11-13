const express = require('express')
const cors = require('cors')

const userController = require('./controllers/user_controller')

const app = express()

app.use(express.json())
app.use(cors())

app.post('/signup', userController.signup)

app.post('/login', userController.login)

app.use((err, req, res, next) => {
    res.status(err.code || 500).json({ message: err.message || 'Something went wrong' })
})

module.exports = app
