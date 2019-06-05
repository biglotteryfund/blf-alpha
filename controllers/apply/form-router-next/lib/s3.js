'use strict';
const AWS = require('aws-sdk');
const fs = require('fs');
const mime = require('mime-types');

AWS.config.credentials = new AWS.SharedIniFileCredentials({
    profile: 'default'
});

const s3 = new AWS.S3({ signatureVersion: 'v4', region: 'eu-west-1' });

const rand = () =>
    Math.random()
        .toString(36)
        .substring(2, 15) +
    Math.random()
        .toString(36)
        .substring(2, 15);

const uploadFile = (filename, fileData) => {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(fileData.path);

        fileStream.on('error', function(err) {
            if (err) {
                reject(new Error(err));
            }
        });

        const extension = mime.extension(fileData.type);
        const uploadKey =
            'build/test/upload/' + rand() + '/' + filename + '.' + extension;

        fileStream.on('open', async () => {
            // @TODO create a secure bucket and key (in secrets)
            // store this file in a named folder for the app ID
            // confirm behaviour when overwriting?
            const params = {
                Body: fileStream,
                Bucket: 'blf-assets',
                Key: uploadKey,
                ContentLength: fileData.size,
                ContentType: fileData.type,
                ServerSideEncryption: 'aws:kms',
                SSEKMSKeyId: 'TBC'
            };
            s3.putObject(params, function(err, data) {
                if (err) {
                    reject(new Error(err));
                }
                resolve({
                    data: data,
                    key: uploadKey
                });
            });
        });
    });
};

module.exports = { uploadFile };
