const HttpError = require("../models/error");
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    if (req.method == 'OPTIONS') {
        return next();
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            throw Error('Authentication failed');
        }

        req.userData = jwt.verify(token, process.env.JWT_SECRET);

        next();

    } catch (err) {
        const error = new HttpError('Authentication failed', 400);
        return next(error);
    }

}