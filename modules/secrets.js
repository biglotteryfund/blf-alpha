'use strict';
const { flow, keyBy, mapValues } = require('lodash/fp');
const fs = require('fs');

let rawParameters;
try {
    rawParameters = JSON.parse(fs.readFileSync('/etc/blf/parameters.json'), 'utf8');
} catch (e) {
    console.info('parameters.json not found -- are you in DEV mode?');
}
const secrets = flow(keyBy('Name'), mapValues('Value'))(rawParameters);

function getSecret(name) {
    if (secrets[name]) {
        return secrets[name];
    } else {
        throw new Error(`Could not find property ${name} in secrets`);
    }
}

module.exports = {
    getSecret
};
