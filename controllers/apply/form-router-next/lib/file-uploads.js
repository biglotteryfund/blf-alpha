'use strict';
const fs = require('fs');
const config = require('config');
const AWS = require('aws-sdk');
const keyBy = require('lodash/keyBy');
const mapValues = require('lodash/mapValues');

const { isTestServer } = require('../../../../common/appData');
const { S3_KMS_KEY_ID } = require('../../../../common/secrets');
const logger = require('../../../../common/logger').child({
    service: 's3-uploads'
});

const scanFile = require('./scan-file');

const S3_UPLOAD_BUCKET = config.get('aws.s3.formUploadBucket');

const s3 = new AWS.S3({
    signatureVersion: 'v4',
    region: 'eu-west-2'
});

/**
 * Determine files to upload
 * - Retrieve the file from Formidable's parsed data
 * - Guard against empty files (eg. ignore empty file inputs when one already exists)
 */
function determineFilesToUpload(fields, files) {
    const validFileFields = fields
        .filter(field => field.type === 'file')
        .filter(field => files[field.name].size > 0);

    return validFileFields.map(field => {
        const fileData = files[field.name];

        return {
            fieldName: field.name,
            fileData: {
                name: fileData.name.trim(),
                size: fileData.size,
                type: fileData.type
            }
        };
    });
}

/**
 * Normalise file data for storage in validation object
 * This is the metadata submitted as part of JSON data
 * which joi validations run against.
 */
function prepareFilesForUpload(fields, files) {
    const filesToUpload = determineFilesToUpload(fields, files);

    const keyedByFieldName = keyBy(filesToUpload, 'fieldName');
    const valuesByField = mapValues(keyedByFieldName, function({ fileData }) {
        return {
            filename: fileData.name.trim(),
            size: fileData.size,
            type: fileData.type
        };
    });

    return { filesToUpload, valuesByField };
}

function uploadFile({ formId, applicationId, fileMetadata }) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(fileMetadata.fileData.path);

        fileStream.on('error', fileReadError => {
            if (fileReadError) {
                return reject({
                    error: fileReadError
                });
            }
        });

        const uploadKey = [
            formId,
            applicationId,
            fileMetadata.fileData.name
        ].join('/');

        fileStream.on('open', async () => {
            if (isTestServer) {
                logger.debug(`Skipped uploading file ${uploadKey}`);
                return resolve();
            } else {
                s3.putObject(
                    {
                        Body: fileStream,
                        Bucket: S3_UPLOAD_BUCKET,
                        Key: uploadKey,
                        ContentLength: fileMetadata.fileData.size,
                        ContentType: fileMetadata.fileData.type,
                        ServerSideEncryption: 'aws:kms',
                        SSEKMSKeyId: S3_KMS_KEY_ID
                    },
                    (uploadErr, data) => {
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
                    }
                );
            }
        });
    });
}

function scanAndUpload({ formId, applicationId, fileMetadata }) {
    if (isTestServer === false) {
        return scanFile(fileMetadata.fileData.path).then(function(status) {
            if (status.is_infected) {
                throw new Error('Infected file found');
            } else {
                return uploadFile({ formId, applicationId, fileMetadata });
            }
        });
    } else {
        return uploadFile({ formId, applicationId, fileMetadata });
    }
}

function getObject({ formId, applicationId, filename }) {
    const keyName = [formId, applicationId, filename].join('/');
    return s3.getObject({
        Bucket: S3_UPLOAD_BUCKET,
        Key: keyName
    });
}

function headObject({ formId, applicationId, filename }) {
    const keyName = [formId, applicationId, filename].join('/');
    return s3
        .headObject({
            Bucket: S3_UPLOAD_BUCKET,
            Key: keyName
        })
        .promise();
}

/**
 * Build object needed for multipart form uploads
 */
function buildMultipartData(pathConfig) {
    return headObject(pathConfig).then(function(headers) {
        return {
            value: getObject(pathConfig).createReadStream(),
            options: {
                filename: pathConfig.filename,
                contentType: headers.ContentType,
                knownLength: headers.ContentLength
            }
        };
    });
}

module.exports = {
    prepareFilesForUpload,
    getObject,
    buildMultipartData,
    scanAndUpload
};
