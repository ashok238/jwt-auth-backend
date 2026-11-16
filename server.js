const mongoose = require('mongoose')
const config = require('./config')
const app = require('./app')

mongoose.connect(config.mongodbUri)
    .then(() => {
        console.log('mongodb connected')
    }).catch((err) => {
        console.error('mongodb not connected', err.message)
    })

app.listen(config.port, () => {
    console.log(`server running on port ${config.port} [${config.appEnv}]`)
})
