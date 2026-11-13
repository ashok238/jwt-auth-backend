const HttpError = require("../models/error");
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    if (req.method == 'OPTIONS') {
        return next();
    }

    try {
        console.log('token:  ');
        const token = req.headers.authorization.split(' ')[1];
        console.log('token:  ' + token);
        if (!token) {
            throw Error('Authentication failed');
        }

        const decodedToken = jwt.verify(token, 'supersecret_key');

        console.log('decoded token' + decodedToken);

        next();

    } catch (err) {
        console.log(err);
        const error = new HttpError('Authentication failed', 400);
        return next(error);
    }

}