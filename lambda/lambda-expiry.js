'use strict';
/* eslint-disable no-console */
const querystring = require('querystring');
const https = require('https');

/**
 * Lambda scheduled job to process application expiry emails.
 * Single HTTP call to a handler endpoint.
 *
 * process.env.SECRET matches up with EMAIL_EXPIRY_SECRET
 * within the main app, acting as basic access control.
 */
exports.handler = (event, context, callback) => {
    const postData = querystring.stringify({
        secret: process.env.SECRET
    });

    const options = {
        hostname: process.env.HOSTNAME,
        port: 443,
        path: '/apply/handle-expiry',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    const req = https.request(options, res => {
        let body = '';
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);

        if (res.statusCode !== 200) {
            throw new Error(`Error sending expiry emails`);
        }

        res.on('data', d => {
            process.stdout.write(d);
        });

        res.on('end', () => {
            if (res.headers['content-type'] === 'application/json') {
                body = JSON.parse(body);
            }
            callback(null, body);
        });
    });

    req.on('error', callback);
    req.write(postData);
    req.end();
};
