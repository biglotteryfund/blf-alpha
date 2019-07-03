'use strict';
const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const features = require('config').get('features');

const { environment, buildNumber } = require('./appData');

function transport() {
    if (features.enableCloudWatchLogs) {
        return new WinstonCloudWatch({
            awsRegion: 'eu-west-2',
            logGroupName: `/tnlcf/${environment}/app`,
            logStreamName: `build-${buildNumber}`,
            jsonMessage: true,
            retentionInDays: 30
        });
    } else {
        return new transports.Console({
            silent: !!process.env.TEST_SERVER === true
        });
    }
}

module.exports = createLogger({
    level: 'info',
    format: format.combine(format.errors({ stack: true }), format.json()),
    transports: [transport()]
});
