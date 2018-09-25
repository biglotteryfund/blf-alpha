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

module.exports = {
    getSecretFromRawParameters,
    getSecret
};
