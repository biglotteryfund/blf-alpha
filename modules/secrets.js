'use strict';
const appData = require('./appData');
const { getSecret } = require('./parameter-store');

/**
 * Primary session secret
 * We allow overriding through an environment variable for CI
 */
const SESSION_SECRET = process.env.SESSION_SECRET || getSecret('session.secret', true);

/**
 * Database connection uri
 * In development we default to an in-memory sqlite database as the
 * databases defined in parameter store can't be accessed outside of a VPC.
 * We allow overriding through an environment variable for CI and to allow
 * using a local MySQL database locally as an option.
 */
const DB_CONNECTION_URI = appData.isDev
    ? process.env.DB_CONNECTION_URI || 'sqlite://:memory'
    : process.env.DB_CONNECTION_URI || getSecret('db.connection-uri', true);

/**
 * Preview domain
 * Define what domain to use for CMS content previewing
 */
const PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || getSecret('preview.domain');

/**
 * Content API url
 * We allow overriding through an environment variable for CI and to allow
 * switching to a local instance of the CMS in development
 */
const CONTENT_API_URL = process.env.CONTENT_API_URL || getSecret('content-api.url', true);

/**
 * Past grants API
 * We allow overriding through an environment variable for CI and to allow
 * switching to a local instance of the API in development
 */
const PAST_GRANTS_API_URI = process.env.PAST_GRANTS_API_URI || getSecret('pastgrants.api.uri', true);

/**
 * Applications service API url
 * Secure service for storing grant programme applications
 */
const APPLICATIONS_SERVICE_ENDPOINT = process.env.APPLICATIONS_SERVICE_ENDPOINT || getSecret('applications-service.endpoint', true);

/**
 * JWT signing token, used for user authentication
 * We allow overriding through an environment variable for CI
 */
const JWT_SIGNING_TOKEN = process.env.JWT_SIGNING_TOKEN || getSecret('user.jwt.secret', true);

/**
 * Sentry DSN for error reporting
 */
const SENTRY_DSN = getSecret('sentry.dsn');

/**
 * Azure authentication secrets (optional, used for tools sign-in)
 */
const AZURE_AUTH = {
    MS_CLIENT_ID: getSecret('ms.auth.clientId'),
    MS_CLIENT_SECRET: getSecret('ms.auth.clientSecret'),
    MS_REDIRECT_URL: process.env.MS_REDIRECT_URL || getSecret('ms.auth.redirectUrl')
};

/**
 * Dotmailer API credentials
 * Used to sign up to email lists
 */
const DOTMAILER_API = { user: getSecret('dotmailer.api.user'), password: getSecret('dotmailer.api.password') };

/**
 * Material supplier email
 * Used for sending order emails when placing and order for free materials
 */
const MATERIAL_SUPPLIER = process.env.MATERIAL_SUPPLIER || getSecret('emails.materials.supplier');

/**
 * Digital fund email
 * Email address used to send expressions of interest from digital fund applicaiton forms
 */
const DIGITAL_FUND_EMAIL = process.env.DIGITAL_FUND_EMAIL || getSecret('emails.digitalfund.demo');

module.exports = {
    APPLICATIONS_SERVICE_ENDPOINT,
    AZURE_AUTH,
    CONTENT_API_URL,
    DB_CONNECTION_URI,
    DIGITAL_FUND_EMAIL,
    DOTMAILER_API,
    JWT_SIGNING_TOKEN,
    MATERIAL_SUPPLIER,
    PAST_GRANTS_API_URI,
    PREVIEW_DOMAIN,
    SENTRY_DSN,
    SESSION_SECRET
};
