'use strict';
const config = require('config');
const fs = require('fs');
const { flow, get, isEmpty, keyBy, mapValues } = require('lodash/fp');

function getRawParameters() {
    let rawParameters;
    try {
        rawParameters = JSON.parse(fs.readFileSync('/etc/blf/parameters.json'), 'utf8');
    } catch (e) {} // eslint-disable-line no-empty
    return rawParameters;
}

function parseSecrets(rawParameters) {
    const mapKeyedValues = flow(keyBy('Name'), mapValues('Value'));
    const secrets = mapKeyedValues(rawParameters);
    return secrets;
}

function getSecretFromRawParameters(rawParameters, name) {
    const secrets = parseSecrets(rawParameters);
    const secret = get(name)(secrets);
    if (secret) {
        return secret;
    } else {
        throw new Error(`Could not find property ${name} in secrets`);
    }
}

function getSecret(name) {
    const rawParameters = getRawParameters();
    if (process.env.CI === true || isEmpty(rawParameters)) {
        console.warn(`Secret "${name}" not found: are you in CI or DEVELOPMENT mode?`);
        return;
    } else {
        return getSecretFromRawParameters(rawParameters, name);
    }
}

// @TODO: Make all process.env vars consistent case
const CONTENT_API_URL = process.env.CONTENT_API_URL || getSecret('content-api.url');
const DATABASE_HOST = process.env.mysqlHost || getSecret('mysql.host');
const DATABASE_NAME = process.env.CUSTOM_DB ? process.env.CUSTOM_DB : config.get('database');
const DATABASE_PASS = process.env.mysqlPassword || getSecret('mysql.password');
const DATABASE_USER = process.env.mysqlUser || getSecret('mysql.user');
const DOTMAILER_API_PASSWORD = getSecret('dotmailer.api.password');
const DOTMAILER_API_USER = getSecret('dotmailer.api.user');
const EMAIL_MATERIALS_SUPPLIER = process.env.MATERIAL_SUPPLIER || getSecret('emails.materials.supplier');
const EMAIL_REACHING_COMMUNITIES_RECIPIENTS = getSecret('emails.reachingcommunities.recipients');
const JWT_SIGNING_TOKEN = process.env.jwtSigningToken || getSecret('user.jwt.secret');
const SENTRY_DSN = getSecret('sentry.dsn');
const SESSION_SECRET = process.env.sessionSecret || getSecret('session.secret');

module.exports = {
    getRawParameters,
    getSecretFromRawParameters,
    getSecret,
    CONTENT_API_URL,
    DATABASE_HOST,
    DATABASE_NAME,
    DATABASE_PASS,
    DATABASE_USER,
    DOTMAILER_API_PASSWORD,
    DOTMAILER_API_USER,
    EMAIL_MATERIALS_SUPPLIER,
    EMAIL_REACHING_COMMUNITIES_RECIPIENTS,
    JWT_SIGNING_TOKEN,
    SENTRY_DSN,
    SESSION_SECRET
};
