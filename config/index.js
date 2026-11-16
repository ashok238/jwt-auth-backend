const path = require('path')
const dotenv = require('dotenv')
const { buildConfig } = require('./build_config')

// Local runs read .env.<APP_ENV>; development also falls back to the legacy .env file.
// Staging and production set variables on the hosting platform instead, and dotenv never overrides them.
const root = path.join(__dirname, '..')
const appEnv = process.env.APP_ENV || 'production'
const envFiles = [path.join(root, `.env.${appEnv}`)]
if (appEnv === 'development') {
    envFiles.push(path.join(root, '.env'))
}
dotenv.config({ path: envFiles, quiet: true })

module.exports = buildConfig(process.env)
