const AWS = require('aws-sdk');
const config = require('config');
const responseTime = require('response-time');
const appData = require('../modules/appData');

const CloudWatch = new AWS.CloudWatch({
    apiVersion: '2010-08-01',
    region: config.get('aws.region')
});

module.exports = responseTime(function(req, res, time) {
    if (appData.isNotProduction) {
        return;
    }

    const method = req.method.toUpperCase();
    const isLegacy = res.getHeader('X-BLF-Legacy') === 'true';
    const metricPrefix = isLegacy ? 'RESPONSE_TIME_LEGACY' : 'RESPONSE_TIME';

    CloudWatch.putMetricData({
        MetricData: [
            {
                MetricName: `${metricPrefix}_${method}`,
                Dimensions: [
                    {
                        Name: 'RESPONSE_TIME',
                        Value: 'TIME_IN_MS'
                    }
                ],
                Unit: 'Milliseconds',
                Value: time
            }
        ],
        Namespace: 'SITE/TRAFFIC'
    }).send();
});
