'use strict';
const { createLogger, format, transports } = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const appData = require('./appData');

const skipLogs = !!process.env.TEST_SERVER === true;

const transport = skipLogs
    ? new transports.Console()
    : new WinstonCloudWatch({
          awsRegion: 'eu-west-2',
          logGroupName: `/tnlcf/${appData.environment}/app`,
          logStreamName: `build-${appData.buildNumber}`,
          jsonMessage: true,
          retentionInDays: 30
      });

module.exports = createLogger({
    level: 'info',
    format: format.combine(format.errors({ stack: true }), format.json()),
    transports: [transport]
});
