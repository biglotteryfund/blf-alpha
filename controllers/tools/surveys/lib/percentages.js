'use strict';
const partition = require('lodash/partition');

module.exports = function percentagesFor(responses) {
    const [yes, no] = partition(responses, ['choice', 'yes']);

    return {
        yesCount: yes.length,
        noCount: no.length,
        percentageYes: Math.round((yes.length / responses.length) * 100),
    };
};
