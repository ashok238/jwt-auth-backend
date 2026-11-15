const dotenv = require('dotenv')
dotenv.config()

const missingEnv = ['JWT_SECRET', 'MONGODB_URI'].filter((name) => !process.env[name])
if (missingEnv.length) {
    console.error(`Missing required environment variables: ${missingEnv.join(', ')}`)
    process.exit(1)
}

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
