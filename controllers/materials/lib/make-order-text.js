'use strict';
const reduce = require('lodash/reduce');
const { stripIndents } = require('common-tags');

const normaliseUserInput = require('./normalise-user-input');

function summariseOrder(items) {
    return reduce(
        items,
        (acc, item) => {
            if (item.quantity > 0) {
                acc.push(
                    `\t- x${item.quantity} ${item.code} (item: ${item.name})`
                );
            }
            return acc;
        },
        []
    );
}

module.exports = function makeOrderText(items, details) {
    /**
     * Parse their details (eg. merge "other" responses into their parent fields)
     * then build it into a string for the order email
     */
    const customerDetails = normaliseUserInput(details).map(
        d => `\t${d.label}: ${d.value}`
    );

    const text = stripIndents`
        A new order has been received from The National Lottery Community Fund website.
        The order details are below:
        
        ${summariseOrder(items).join('\n')}
        
        The customer's personal details are below:
        
        ${customerDetails.join('\n')}
        
        This email has been automatically generated from The National Lottery Community Fund website.
        If you have feedback, please contact digital.monitoring@tnlcommunityfund.org.uk.
    `;

    return text.trim();
};
