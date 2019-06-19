'use strict';
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const appData = require('./appData');

const skipLogs = !!process.env.TEST_SERVER === true;

if (!skipLogs) {
    // Push logs to Cloudwatch
    winston.add(
        new WinstonCloudWatch({
            awsRegion: 'eu-west-2',
            logGroupName: 'WWW_APP_LOG',
            logStreamName: appData.environment,
            jsonMessage: true,
            retentionInDays: 30
        })
    );
}

module.exports = winston;
