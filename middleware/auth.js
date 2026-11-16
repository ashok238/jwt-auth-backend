const HttpError = require("../models/error");
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }

    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return next(new HttpError('Authentication failed', 401));
    }

    try {
        const { userId, username } = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
        // Tokens issued before userId was added to the payload are rejected
        if (!userId) {
            throw new Error('Token missing userId');
        }
        req.userData = { userId, username };
        next();
    } catch (err) {
        return next(new HttpError('Authentication failed', 401));
    }
}