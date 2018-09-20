'use strict';
const fs = require('fs');
const { flow, get, keyBy, mapValues } = require('lodash/fp');

function getRawParameters() {
    let rawParameters;
    try {
        rawParameters = JSON.parse(fs.readFileSync('/etc/blf/parameters.json', 'utf8'));
    } catch (e) {} // eslint-disable-line no-empty
    return rawParameters;
}

function parseSecrets(rawParameters) {
    const mapKeyedValues = flow(
        keyBy('Name'),
        mapValues('Value')
    );
    return mapKeyedValues(rawParameters);
}

function getSecretFromRawParameters(rawParameters, name, shouldThrowIfMissing = false) {
    const secrets = parseSecrets(rawParameters);
    const secret = get(name)(secrets);

    if (shouldThrowIfMissing === true && typeof secret === 'undefined') {
        throw new Error(`Secret missing: ${name}`);
    } else {
        return secret;
    }
}

function getSecret(name, shouldThrowIfMissing = false) {
    const rawParameters = getRawParameters();
    return getSecretFromRawParameters(rawParameters, name, shouldThrowIfMissing);
}

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

// We store these strings in one parameter for the sake of sanity
// in the format <string:32>;<string:12>
const MS_COOKIE_1 = process.env.MS_COOKIE_1 || getSecret('ms.cookie.1');
const MS_COOKIE_2 = process.env.MS_COOKIE_2 || getSecret('ms.cookie.2');

module.exports = {
    getRawParameters,
    getSecretFromRawParameters,
    getSecret,
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
        MS_CLIENT_SECRET,
        MS_COOKIES: [MS_COOKIE_1, MS_COOKIE_2]
    }
};
