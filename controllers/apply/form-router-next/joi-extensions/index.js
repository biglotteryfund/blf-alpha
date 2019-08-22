'use strict';
const baseJoi = require('@hapi/joi');

const budgetItems = require('./budget-items');
const budgetTotalCosts = require('./budget-total-costs');
const dateParts = require('./date-parts');
const dateRange = require('./date-range');
const dayMonth = require('./day-month');
const fullName = require('./full-name');
const monthYear = require('./month-year');
const phoneNumber = require('./phone-number');
const postcode = require('./postcode');
const ukAddress = require('./uk-address');
const wordCount = require('./word-count');

module.exports = baseJoi.extend([
    budgetItems,
    budgetTotalCosts,
    dateParts,
    dateRange,
    dayMonth,
    fullName,
    monthYear,
    phoneNumber,
    postcode,
    ukAddress,
    wordCount
]);
