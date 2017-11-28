'use strict';

const morgan = require('morgan');

const logFormat =
    '[:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms ":referrer"';

module.exports = morgan(logFormat, {
    skip: req => {
        return req.originalUrl === '/status';
    }
});
