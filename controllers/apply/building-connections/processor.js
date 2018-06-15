'use strict';

module.exports = function processor(formModel, formData) {
    console.log(formData);
    return Promise.resolve(formData);
};
