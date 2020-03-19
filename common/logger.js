'use strict';
const config = require('config');
const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const { environment, buildNumber, isTestServer, isDev } = require('./appData');

function useConsoleLogger() {
    return (
        process.env.IS_TEST_RUN ||
        process.env.CI ||
        isTestServer === true ||
        isDev === true
    );
}

function getTransports() {
    if (useConsoleLogger()) {
        return [
            new transports.Console({
                silent: process.env.CI || process.env.IS_TEST_RUN,
                format: format.combine(
                    format.colorize(),
                    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    format.printf(function(info) {
                        return `${info.timestamp} [${info.level}] ${info.message}`;
                    })
                )
            })
        ];
    } else {
        return [
            new WinstonCloudWatch({
                level: process.env.LOG_LEVEL || config.get('logLevel'),
                awsRegion: config.get('aws.region'),
                logGroupName: `/tnlcf/${environment}/app`,
                logStreamName: `build-${buildNumber}`,
                jsonMessage: true,
                retentionInDays: 30
            })
        ];
    }
}

module.exports = createLogger({
    level: process.env.LOG_LEVEL || config.get('logLevel'),
    format: format.combine(format.errors({ stack: true }), format.json()),
    transports: getTransports()
});
