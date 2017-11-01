'use strict';
const fs = require('fs');
const { flow, isEmpty, keyBy, mapValues } = require('lodash/fp');

function getRawParameters() {
    let rawParameters;
    try {
        rawParameters = JSON.parse(fs.readFileSync('/etc/blf/parameters.json'), 'utf8');
    } catch (e) {} // eslint-disable-line no-empty
    return rawParameters;
}

const mapKeyedValues = flow(keyBy('Name'), mapValues('Value'));
const secrets = mapKeyedValues(getRawParameters());

module.exports = function getSecret(name) {
    if (process.env.CI === true || isEmpty(secrets)) {
        console.warn(`Secret "${name}" not found: are you in CI or DEVELOPMENT mode?`);
    } else if (name in secrets) {
        return secrets[name];
    } else {
        throw new Error(`Could not find property ${name} in secrets`);
    }
};
