'use strict';
const winston = require('winston');
const path = require('path');

const logFilename = 'blf.log';
const logFilePath = path.join(__dirname, 'logs', logFilename);

if (process.env.NODE_ENV === 'production') {
    winston.add(winston.transports.File, {filename: logFilePath});
}

winston.log('info', 'Logger initialised at ' + logFilePath);
module.exports = winston;