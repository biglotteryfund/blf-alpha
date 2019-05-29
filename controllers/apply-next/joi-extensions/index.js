'use strict';
const baseJoi = require('@hapi/joi');
const phoneNumber = require('joi-phone-number');
const budgetItems = require('./budget-items');
const budgetTotalCosts = require('./budget-total-costs');
const dateParts = require('./date-parts');
const dateRange = require('./date-range');
const dayMonth = require('./day-month');
const postcode = require('./postcode');
const wordCount = require('./word-count');
const ukAddress = require('./uk-address');

module.exports = baseJoi.extend([
    postcode,
    phoneNumber,
    budgetItems,
    budgetTotalCosts,
    dateParts,
    dateRange,
    dayMonth,
    ukAddress,
    wordCount
]);
