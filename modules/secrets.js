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
    const mapKeyedValues = flow(
        keyBy('Name'),
        mapValues('Value')
    );
    return mapKeyedValues(rawParameters);
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

const APPLICATIONS_SERVICE_ENDPOINT =
    process.env.APPLICATIONS_SERVICE_ENDPOINT || getSecret('applications-service.endpoint');

const CONTENT_API_URL = process.env.CONTENT_API_URL || getSecret('content-api.url');

const DB_HOST = process.env.mysqlHost || getSecret('mysql.host');
const DB_NAME = process.env.CUSTOM_DB ? process.env.CUSTOM_DB : config.get('database');
const DB_PASS = process.env.mysqlPassword || getSecret('mysql.password');
const DB_USER = process.env.mysqlUser || getSecret('mysql.user');

// @TODO: Update parameter store to always pass connection URI
const DB_CONNECTION_URI = process.env.DB_CONNECTION_URI || `mysql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}`;

const JWT_SIGNING_TOKEN = process.env.jwtSigningToken || getSecret('user.jwt.secret');
const MATERIAL_SUPPLIER = process.env.MATERIAL_SUPPLIER || getSecret('emails.materials.supplier');
const SENTRY_DSN = process.env.SENTRY_DSN || getSecret('sentry.dsn');
const SESSION_SECRET = process.env.sessionSecret || getSecret('session.secret');
const TOOLS_CMS_ADMIN_URL = getSecret('tools.cms-admin-url');
const TOOLS_ANALYTICS_DASHBOARD_URL = getSecret('tools.analytics-dashboard-url');
const TOOLS_DATASTUDIO_URL = getSecret('tools.datastudio-url');

const HUB_EMAILS = {
    northWest: getSecret('emails.hubs.northwest'),
    northEastCumbria: getSecret('emails.hubs.northeastcumbria'),
    midlands: getSecret('emails.hubs.midlands'),
    southWest: getSecret('emails.hubs.southwest'),
    londonSouthEast: getSecret('emails.hubs.londonsoutheast'),
    yorksHumber: getSecret('emails.hubs.yorkshumber'),
    england: getSecret('emails.hubs.england')
};

module.exports = {
    getRawParameters,
    getSecretFromRawParameters,
    getSecret,
    APPLICATIONS_SERVICE_ENDPOINT,
    CONTENT_API_URL,
    DB_CONNECTION_URI,
    HUB_EMAILS,
    JWT_SIGNING_TOKEN,
    MATERIAL_SUPPLIER,
    SENTRY_DSN,
    SESSION_SECRET,
    TOOLS_CMS_ADMIN_URL,
    TOOLS_ANALYTICS_DASHBOARD_URL,
    TOOLS_DATASTUDIO_URL
};
