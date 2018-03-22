'use strict';
const fs = require('fs');
const { flow, get, isEmpty, keyBy, mapValues } = require('lodash/fp');
const config = require('config');

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

const CONTENT_API_URL = process.env.CONTENT_API_URL || getSecret('content-api.url');
const DB_NAME = process.env.CUSTOM_DB ? process.env.CUSTOM_DB : config.get('database');
const DB_HOST = process.env.mysqlHost || getSecret('mysql.host');
const DB_USER = process.env.mysqlUser || getSecret('mysql.user');
const DB_PASS = process.env.mysqlPassword || getSecret('mysql.password');
const EMAIL_REACHING_COMMUNITIES = getSecret('emails.reachingcommunities.recipients');
const JWT_SIGNING_TOKEN = process.env.jwtSigningToken || getSecret('user.jwt.secret');
const SENTRY_DSN = process.env.SENTRY_DSN || getSecret('sentry.dsn');
const SESSION_SECRET = process.env.sessionSecret || getSecret('session.secret');

module.exports = {
    getRawParameters,
    getSecretFromRawParameters,
    getSecret,
    CONTENT_API_URL,
    DB_NAME,
    DB_HOST,
    DB_USER,
    DB_PASS,
    EMAIL_REACHING_COMMUNITIES,
    JWT_SIGNING_TOKEN,
    SENTRY_DSN,
    SESSION_SECRET
};
