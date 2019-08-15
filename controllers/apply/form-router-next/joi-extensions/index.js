'use strict';
const baseJoi = require('@hapi/joi');

module.exports = baseJoi.extend([
    require('./budget-items'),
    require('./compare-object'),
    require('./date-parts'),
    require('./date-range'),
    require('./day-month'),
    require('./friendly-number'),
    require('./month-year'),
    require('./phone-number'),
    require('./postcode'),
    require('./word-count')
]);
