'use strict';
const fs = require('fs');
const config = require('config');
const AWS = require('aws-sdk');
const get = require('lodash/get');
const keyBy = require('lodash/keyBy');
const mapValues = require('lodash/mapValues');
const debug = require('debug')('tnlcf:s3');

const { S3_KMS_KEY_ID } = require('../../../../common/secrets');

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
        .filter(field => get(files, field.name).size > 0);

    return validFileFields.map(field => {
        return {
            fieldName: field.name,
            fileData: get(files, field.name)
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
            filename: fileData.name,
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
            if (!!process.env.TEST_SERVER === true) {
                debug(`skipped uploading file ${uploadKey}`);
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
    uploadFile,
    getObject,
    buildMultipartData
};
