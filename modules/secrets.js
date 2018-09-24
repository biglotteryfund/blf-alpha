'use strict';
const { getSecret } = require('./parameter-store');

/* =========================================================================
   Secret Constants
   ========================================================================= */

/**
 * Required: Without these the app won't start
 */
const APPLICATIONS_SERVICE_ENDPOINT =
    process.env.APPLICATIONS_SERVICE_ENDPOINT || getSecret('applications-service.endpoint', true);
const CONTENT_API_URL = process.env.CONTENT_API_URL || getSecret('content-api.url', true);
const DB_CONNECTION_URI = process.env.DB_CONNECTION_URI || getSecret('db.connection-uri', true);
const JWT_SIGNING_TOKEN = process.env.JWT_SIGNING_TOKEN || getSecret('user.jwt.secret', true);
const SESSION_SECRET = process.env.SESSION_SECRET || getSecret('session.secret', true);

/**
 * Additional: Without these the app will start but some functionality will be unavailable
 */
const DOTMAILER_API = { user: getSecret('dotmailer.api.user'), password: getSecret('dotmailer.api.password') };
const MATERIAL_SUPPLIER = process.env.MATERIAL_SUPPLIER || getSecret('emails.materials.supplier');
const PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || getSecret('preview.domain');
const SENTRY_DSN = process.env.SENTRY_DSN || getSecret('sentry.dsn');
const DIGITAL_FUNDING_EMAIL = process.env.DIGITAL_FUNDING_EMAIL || getSecret('emails.digitalfund.demo');
const PAST_GRANTS_API_URI = process.env.PAST_GRANTS_API_URI || getSecret('pastgrants.api.uri');

/**
 * Azure authentication secrets (optional, used for tools sign-in)
 */
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || getSecret('ms.auth.clientId');
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || getSecret('ms.auth.clientSecret');
const MS_REDIRECT_URL = process.env.MS_REDIRECT_URL || getSecret('ms.auth.redirectUrl');

module.exports = {
    APPLICATIONS_SERVICE_ENDPOINT,
    CONTENT_API_URL,
    DB_CONNECTION_URI,
    DOTMAILER_API,
    JWT_SIGNING_TOKEN,
    MATERIAL_SUPPLIER,
    PREVIEW_DOMAIN,
    SENTRY_DSN,
    SESSION_SECRET,
    DIGITAL_FUNDING_EMAIL,
    PAST_GRANTS_API_URI,
    AZURE_AUTH: {
        MS_CLIENT_ID,
        MS_REDIRECT_URL,
        MS_CLIENT_SECRET
    }
};
