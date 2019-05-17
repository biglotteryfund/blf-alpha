'use strict';
const baseJoi = require('@hapi/joi');
const phoneNumber = require('joi-phone-number');
const budgetItems = require('./budget-items');
const budgetTotalCosts = require('./budget-total-costs');
const dateParts = require('./date-parts');
const dayMonth = require('./day-month');
const wordCount = require('./word-count');

module.exports = baseJoi.extend([
    phoneNumber,
    wordCount,
    dateParts,
    dayMonth,
    budgetItems,
    budgetTotalCosts
]);
