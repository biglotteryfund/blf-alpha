'use strict';
const _ = require('lodash');
const secrets = require('../config/secrets.json');
module.exports = _.chain(secrets).keyBy('Name').mapValues('Value').value();