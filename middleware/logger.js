'use strict';
const morgan = require('morgan');

const logFormat =
    '[:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms ":referrer"';

const skipLogs = process.env.SKIP_LOGS;

module.exports = morgan(logFormat, {
    skip: req => skipLogs || req.originalUrl === '/status'
});
