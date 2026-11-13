const dotenv = require('dotenv')
dotenv.config()

const mongoose = require('mongoose')
const app = require('./app')

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('monogodb connected')
    }).catch((err) => {
        console.log(' mongodb not connected')
    })

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})
