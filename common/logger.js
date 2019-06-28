'use strict';
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const appData = require('./appData');

const skipLogs = !!process.env.TEST_SERVER === true;

const transport = skipLogs
    ? new winston.transports.Console({
          format: winston.format.simple()
      })
    : new WinstonCloudWatch({
          awsRegion: 'eu-west-2',
          logGroupName: `/tnlcf/${appData.environment}/app`,
          logStreamName: appData.buildNumber,
          jsonMessage: true,
          retentionInDays: 30
      });

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [transport]
});

module.exports = logger;
