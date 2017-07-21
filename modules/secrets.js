'use strict';
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

let secrets = {};

try {
    secrets = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/app/parameters.json'), 'utf8'));
} catch (e) {
    console.info('parameters.json not found -- are you in DEV mode?');
}

module.exports = _.chain(secrets).keyBy('Name').mapValues('Value').value();