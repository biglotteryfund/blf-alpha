'use strict';
const baseJoi = require('@hapi/joiNext');

module.exports = baseJoi.extend(
    require('./compare-object'),
    require('./friendly-number'),
    // require('./budget-items'),
    // require('./date-parts'),
    // require('./date-range'),
    // require('./day-month'),
    require('./full-name'),
    // require('./month-year'),
    require('./phone-number'),
    require('./postcode'),
    require('./uk-address'),
    require('./word-count')
);
