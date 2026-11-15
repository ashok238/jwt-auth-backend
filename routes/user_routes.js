const express = require('express')
const rateLimit = require('express-rate-limit')

const userController = require('../controllers/user_controller')
const auth = require('../middleware/auth')

const router = express.Router()

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later' }
})

router.post('/signup', authLimiter, userController.signup)
router.post('/login', authLimiter, userController.login)

router.get('/me', auth, userController.getMe)

module.exports = router
