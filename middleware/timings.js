const AWS = require('aws-sdk');
const config = require('config');
const responseTime = require('response-time');
const appData = require('../modules/appData');

const cloudwatch = new AWS.CloudWatch({
    apiVersion: '2010-08-01',
    region: config.get('aws.region')
});

module.exports = responseTime(function(req, res, time) {
    if (appData.isNotProduction) {
        return;
    }

    if (req.method === 'GET') {
        cloudwatch
            .putMetricData({
                MetricData: [
                    {
                        MetricName: 'RESPONSE_TIME_GET',
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
            })
            .send();
    } else if (req.method === 'POST') {
        cloudwatch
            .putMetricData({
                MetricData: [
                    {
                        MetricName: 'RESPONSE_TIME_POST',
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
            })
            .send();
    }
});
