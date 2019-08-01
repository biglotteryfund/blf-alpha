'use strict';
const config = require('config');
const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const { environment, buildNumber, isTestServer } = require('./appData');

function enableCloudWatchLogs() {
    if (process.env.CI || isTestServer === true) {
        return false;
    } else {
        return config.get('features.enableCloudWatchLogs');
    }
}

function getTransports() {
    if (enableCloudWatchLogs()) {
        return [
            new WinstonCloudWatch({
                awsRegion: config.get('aws.region'),
                logGroupName: `/tnlcf/${environment}/app`,
                logStreamName: `build-${buildNumber}`,
                jsonMessage: true,
                retentionInDays: 30
            })
        ];
    } else {
        return [
            new transports.Console({
                silent: process.env.CI,
                format: format.combine(
                    format.colorize(),
                    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    format.printf(function(info) {
                        return `${info.timestamp} [${info.level}] ${info.message}`;
                    })
                )
            })
        ];
    }
}

module.exports = createLogger({
    level: process.env.LOG_LEVEL || config.get('logLevel'),
    format: format.combine(format.errors({ stack: true }), format.json()),
    transports: getTransports()
});
