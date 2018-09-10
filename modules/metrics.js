'use strict';
const AWS = require('aws-sdk');
const config = require('config');

/**
 * Record a count as a CloudWatch event
 *
 * @param {object} options
 * @param {string} options.namespace
 * @param {string} options.metric
 * @param {string} options.name
 * @param {string} options.value
 * @returns {void}
 */
function countEvent({ namespace, metric, name, value }) {
    const CloudWatch = new AWS.CloudWatch({
        apiVersion: '2010-08-01',
        region: config.get('aws.region')
    });

    return CloudWatch.putMetricData({
        Namespace: namespace,
        MetricData: [
            {
                MetricName: metric,
                Dimensions: [{ Name: name, Value: value }],
                Unit: 'Count',
                Value: 1.0
            }
        ]
    }).send();
}

module.exports = {
    countEvent
};
