'use strict';
const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('config');
const { S3_KMS_KEY_ID } = require('../../../../common/secrets');

const s3 = new AWS.S3({ signatureVersion: 'v4', region: 'eu-west-2' });
const bucket = config.get('aws.s3.formUploadBucket');

const uploadFile = ({ formId, applicationId, fileMetadata }) => {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(fileMetadata.fileData.path);

        fileStream.on('error', fileReadError => {
            if (fileReadError) {
                return reject(fileReadError);
            }
        });

        const uploadKey = [
            formId,
            applicationId,
            fileMetadata.fileData.name
        ].join('/');

        fileStream.on('open', async () => {
            const params = {
                Body: fileStream,
                Bucket: bucket,
                Key: uploadKey,
                ContentLength: fileMetadata.fileData.size,
                ContentType: fileMetadata.fileData.type,
                ServerSideEncryption: 'aws:kms',
                SSEKMSKeyId: S3_KMS_KEY_ID
            };
            s3.putObject(params, (uploadErr, data) => {
                if (uploadErr) {
                    return reject({
                        error: uploadErr,
                        fieldName: fileMetadata.fieldName
                    });
                } else {
                    return resolve({
                        data: data,
                        key: uploadKey
                    });
                }
            });
        });
    });
};

const getFile = ({ formId, applicationId, filename }) => {
    return s3.getObject({
        Bucket: bucket,
        Key: [formId, applicationId, filename].join('/')
    });
};

module.exports = { uploadFile, getFile };
