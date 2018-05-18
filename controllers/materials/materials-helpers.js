'use strict';
const { map } = require('lodash/fp');

/**
 * Create text for order email
 */
function makeOrderText(orderItems, fields) {
    const orderSummary = map(item => `\t- x${item.quantity} ${item.code} (item: ${item.name})`);

    const customerDetails = fields.map(field => {
        return `\t${field.emailKey}: ${field.value}`;
    });

    const text = `
A new order has been received from the Big Lottery Fund website. The order details are below:

${orderSummary(orderItems).join('\n')}

The customer's personal details are below:

${customerDetails.join('\n')}

This email has been automatically generated from the Big Lottery Fund website.
If you have feedback, please contact matt.andrews@biglotteryfund.org.uk.`;

    return text.trim();
}

module.exports = {
    makeOrderText
};
