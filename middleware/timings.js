'use strict';
const AWS = require('aws-sdk');
const config = require('config');
const responseTime = require('response-time');
const debug = require('debug')('biglotteryfund:timings');

const CloudWatch = new AWS.CloudWatch({
    apiVersion: '2010-08-01',
    region: config.get('aws.region')
});

const featureIsEnabled = config.get('features.enableTimingMetrics');

module.exports = responseTime(function(req, res, time) {
    if (featureIsEnabled === true) {
        const method = req.method.toUpperCase();

        if (method === 'GET' || method === 'POST') {
            const isLegacy = res.getHeader('X-BLF-Legacy') === 'true';
            const metricPrefix = isLegacy ? 'RESPONSE_TIME_LEGACY' : 'RESPONSE_TIME';

            const metric = {
                MetricName: `${metricPrefix}_${method}`,
                Dimensions: [
                    {
                        Name: 'RESPONSE_TIME',
                        Value: 'TIME_IN_MS'
                    }
                ],
                Unit: 'Milliseconds',
                Value: time
            };

            debug('Sending response timings to CloudWatch');
            CloudWatch.putMetricData({
                MetricData: [metric],
                Namespace: 'SITE/TRAFFIC'
            }).send();
        }
    }
});
