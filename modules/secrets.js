'use strict';
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

const CONTENT_API_URL = process.env.CONTENT_API_URL || getSecret('content-api.url');
const JWT_SIGNING_TOKEN = process.env.jwtSigningToken || getSecret('user.jwt.secret');
const SENTRY_DSN = getSecret('sentry.dsn');
const SESSION_SECRET = process.env.sessionSecret || getSecret('session.secret');

module.exports = {
    getRawParameters,
    getSecretFromRawParameters,
    getSecret,
    CONTENT_API_URL,
    JWT_SIGNING_TOKEN,
    SENTRY_DSN,
    SESSION_SECRET
};
