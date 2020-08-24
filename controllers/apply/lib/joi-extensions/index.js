'use strict';
const baseJoi = require('joi');

module.exports = baseJoi.extend(
    require('./compare-object'),
    require('./friendly-number'),
    require('./budget-items'),
    require('./date-parts'),
    require('./date-range'),
    require('./day-month'),
    require('./month-year'),
    require('./phone-number'),
    require('./postcode'),
    require('./uk-address'),
    require('./word-count')
);
