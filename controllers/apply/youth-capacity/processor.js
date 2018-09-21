'use strict';

module.exports = async function processor({ form, data, stepsWithValues, copy, mailTransport = null }) {
    return Promise.resolve({ form, data, stepsWithValues, copy, mailTransport });
};
