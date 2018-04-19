const AWS = require('aws-sdk');
const responseTime = require('response-time');

AWS.config.update({ region: 'eu-west-1' });

const cloudwatch = new AWS.CloudWatch({ apiVersion: '2010-08-01' });

module.exports = responseTime(function(req, res, time) {
    if (req.method === 'GET') {
        cloudwatch.putMetricData({
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
        });
    } else if (req.method === 'POST') {
        cloudwatch.putMetricData({
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
        });
    }
});
