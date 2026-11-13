const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')


const userController = require('./controllers/user_controller')

const app = express()

app.use(express.json())
app.use(cors())

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('monogodb connected')
    }).catch((err) => {
        console.log(' mongodb not connected')
    })


app.post('/signup', userController.signup)

app.post('/login', userController.login)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})
