'use strict';
const fs = require('fs');
const flow = require('lodash/fp/flow');
const keyBy = require('lodash/fp/keyBy');
const mapValues = require('lodash/fp/mapValues');
const has = require('lodash/has');

require('dotenv').config();

function getRawParameters() {
    let rawParameters;
    const secretDir = has(process.env, 'SECRET_DIR')
        ? process.env.SECRET_DIR
        : '/etc/blf';
    try {
        rawParameters = JSON.parse(
            fs.readFileSync(`${secretDir}/parameters.json`, 'utf8')
        );
    } catch (e) {} // eslint-disable-line no-empty
    return rawParameters;
}

function getFromRawParameters(
    rawParameters,
    name,
    shouldThrowIfMissing = false
) {
    const mapKeyedValues = flow(keyBy('Name'), mapValues('Value'));

    const allParameters = mapKeyedValues(rawParameters);
    const match = allParameters[name];

    if (shouldThrowIfMissing === true && typeof match === 'undefined') {
        throw new Error(`parameter missing: ${name}`);
    } else {
        return match;
    }
}

function getParameter(name, shouldThrowIfMissing = false) {
    const rawParameters = getRawParameters();
    return getFromRawParameters(rawParameters, name, shouldThrowIfMissing);
}

module.exports = {
    getFromRawParameters,
    getParameter
};
