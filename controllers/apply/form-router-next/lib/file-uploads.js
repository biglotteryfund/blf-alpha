'use strict';
const fs = require('fs');
const config = require('config');
const AWS = require('aws-sdk');
const get = require('lodash/get');
const keyBy = require('lodash/keyBy');
const mapValues = require('lodash/mapValues');
const NodeClam = require('clamscan');

const { isTestServer } = require('../../../../common/appData');
const { S3_KMS_KEY_ID } = require('../../../../common/secrets');
const logger = require('../../../../common/logger').child({
    service: 's3-uploads'
});

const S3_UPLOAD_BUCKET = config.get('aws.s3.formUploadBucket');

const s3 = new AWS.S3({
    signatureVersion: 'v4',
    region: 'eu-west-2'
});

const ClamScan = new NodeClam().init({
    debug_mode: false,
    scan_recursively: false,
    clamdscan: {
        socket: config.get('clamdscan.socket'),
        timeout: config.get('clamdscan.timeout'),
        local_fallback: true,
        path: config.get('clamdscan.path'),
        config_file: config.get('clamdscan.config_file'),
        multiscan: false,
        reload_db: true,
        active: false,
        bypass_test: true,
    },
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

function checkAntiVirusClamD(formId, applicationId, fileMetadata) {
    const keyName = [formId, applicationId, fileMetadata.fileData.name].join('/');

    return ClamScan.then(async clamscan => {
        const {
            is_infected,
            viruses
        } = await clamscan.scan_file(fileMetadata.fileData.path);

        if (is_infected) {
            logger.error(`${keyName} is infected with ${viruses}`);
            throw new Error('ERR_FILE_SCAN_INFECTED');
        } else {
            return { Key: 'av-status', Value: 'CLEAN' };
        }
    }).catch(err => {
        logger.error(`Attempted read of unscanned file at ${keyName} - ${err.message}`);
        throw new Error('ERR_FILE_SCAN_UNKNOWN');
    });
}

function checkAntiVirus({ formId, applicationId, filename }) {
    const keyName = [formId, applicationId, filename].join('/');

    return s3
    .getObjectTagging({
        Bucket: S3_UPLOAD_BUCKET,
        Key: keyName
    })
    .promise()
    .then(function(tags) {
        const tagSet = get(tags, 'TagSet', []);
        const avStatus = tagSet.find(t => t.Key === 'av-status');

        if (avStatus && get(avStatus, 'Value') === 'CLEAN') {
            return avStatus;
        } else if (avStatus && get(avStatus, 'Value') === 'INFECTED') {
            logger.error(`Infected file found at ${keyName}`);
            throw new Error('ERR_FILE_SCAN_INFECTED');
        } else {
            logger.error(`Attempted read of unscanned file at ${keyName}`);
            throw new Error('ERR_FILE_SCAN_UNKNOWN');
        }
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
    buildMultipartData,
    checkAntiVirus,
    checkAntiVirusClamD
};
