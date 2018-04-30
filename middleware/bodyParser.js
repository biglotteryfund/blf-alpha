'use strict';
const bodyParser = require('body-parser');

module.exports = [bodyParser.json(), bodyParser.urlencoded({ extended: false })];
