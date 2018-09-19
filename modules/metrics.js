'use strict';
const AWS = require('aws-sdk');
const config = require('config');

/**
 * @typedef {object} MetricConfig
 * @property {string} name
 * @property {string} namespace
 * @property {string} dimension
 * @property {string} value
 */

/**
 * Build cloudwatch metric data object
 * @param {object} MetricConfig
 */
function _buildCountMetricData({ name, namespace, dimension, value }) {
    const environment = config.util.getEnv('NODE_ENV').toUpperCase();
    const MetricName = `${dimension.toUpperCase()}_${environment}_${name.replace('-', '_').toUpperCase()}`;

    return {
        Namespace: namespace,
        MetricData: [
            {
                MetricName: MetricName,
                Dimensions: [{ Name: dimension, Value: value }],
                Unit: 'Count',
                Value: 1.0
            }
        ]
    };
}

/**
 * Record a count as a CloudWatch event
 *
 * @param {MetricConfig} options
 * @returns {void}
 */
function count(options) {
    const CloudWatch = new AWS.CloudWatch({
        apiVersion: '2010-08-01',
        region: config.get('aws.region')
    });

    const metricData = _buildCountMetricData(options);
    return CloudWatch.putMetricData(metricData).send();
}

module.exports = {
    _buildCountMetricData,
    count
};
