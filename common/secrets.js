'use strict';
const { getSecret } = require('./parameter-store');

/**
 * Primary session secret
 * We allow overriding through an environment variable for CI
 */
const SESSION_SECRET =
    process.env.SESSION_SECRET || getSecret('session.secret', true);

const AWARDS_FOR_ALL_SECRET =
    process.env.AWARDS_FOR_ALL_SECRET || getSecret('awardsForAll.secret');

/**
 * Database connection uri
 * Note: Our RDS databases are not accessible outside of a VPC.
 * We allow overriding through an environment variable for CI and local environments.
 */
const DB_CONNECTION_URI =
    process.env.DB_CONNECTION_URI || getSecret('db.connection-uri', true);

/**
 * Content API url
 * We allow overriding through an environment variable for CI and to allow
 * switching to a local instance of the CMS in development
 */
const CONTENT_API_URL =
    process.env.CONTENT_API_URL || getSecret('content-api.url', true);

/**
 * Past grants API
 * We allow overriding through an environment variable for CI and to allow
 * switching to a local instance of the API in development
 */
const PAST_GRANTS_API_URI =
    process.env.PAST_GRANTS_API_URI || getSecret('pastgrants.api.uri', true);

/**
 * JWT signing token, used for user authentication
 * We allow overriding through an environment variable for CI
 */
const JWT_SIGNING_TOKEN =
    process.env.JWT_SIGNING_TOKEN || getSecret('user.jwt.secret', true);

/**
 * Sentry DSN for error reporting
 */
const SENTRY_DSN = getSecret('sentry.publicDsn');

/**
 * Azure authentication secrets (optional, used for tools sign-in)
 */
const AZURE_AUTH = {
    metadataUrl: `https://login.microsoftonline.com/tnlcommunityfund.onmicrosoft.com/.well-known/openid-configuration`,
    clientId: getSecret('ms.auth.tnlcf.clientId'),
    clientSecret: getSecret('ms.auth.tnlcf.clientSecret'),
    redirectUrl: process.env.MS_REDIRECT_URL || getSecret('ms.auth.redirectUrl')
};

/**
 * Salesforce authentication
 */
const SALESFORCE_AUTH = {
    apiUrl: process.env.SALESFORCE_API_URL || getSecret('salesforce.apiUrl'),
    consumerKey:
        process.env.SALESFORCE_CONSUMER_KEY ||
        getSecret('salesforce.consumerKey'),
    consumerSecret:
        process.env.SALESFORCE_CONSUMER_SECRET ||
        getSecret('salesforce.consumerSecret'),
    username:
        process.env.SALESFORCE_USERNAME || getSecret('salesforce.username'),
    password:
        process.env.SALESFORCE_PASSWORD || getSecret('salesforce.password'),
    token: process.env.SALESFORCE_TOKEN || getSecret('salesforce.token'),
    instanceId:
        process.env.SALESFORCE_INSTANCE_ID || getSecret('salesforce.instanceId')
};

// These expire in July 2020
const BANK_API = {
    KEY: process.env.SALESFORCE_TOKEN || getSecret('bank.api.key'),
    PASSWORD: process.env.SALESFORCE_TOKEN || getSecret('bank.api.password')
};

/**
 * Material supplier email
 * Used for sending order emails when placing and order for free materials
 */
const MATERIAL_SUPPLIER =
    process.env.MATERIAL_SUPPLIER || getSecret('emails.materials.supplier');

/**
 * Digital fund email
 * Email address used to send expressions of interest from digital fund application forms
 */
const DIGITAL_FUND_EMAIL =
    process.env.DIGITAL_FUND_EMAIL || getSecret('emails.digitalfund.demo');

const POSTCODES_API_KEY =
    process.env.POSTCODES_API_KEY || getSecret('postcodes.api.key');

const S3_KMS_KEY_ID = process.env.S3_KMS_KEY_ID || getSecret('s3.kms.key.id');

const DATA_STUDIO_AFA_URL =
    process.env.DATA_STUDIO_AFA_URL || getSecret('dataStudio.url.awardsForAll');

module.exports = {
    AWARDS_FOR_ALL_SECRET,
    AZURE_AUTH,
    CONTENT_API_URL,
    DATA_STUDIO_AFA_URL,
    DB_CONNECTION_URI,
    DIGITAL_FUND_EMAIL,
    JWT_SIGNING_TOKEN,
    MATERIAL_SUPPLIER,
    PAST_GRANTS_API_URI,
    POSTCODES_API_KEY,
    S3_KMS_KEY_ID,
    SALESFORCE_AUTH,
    BANK_API,
    SENTRY_DSN,
    SESSION_SECRET
};
