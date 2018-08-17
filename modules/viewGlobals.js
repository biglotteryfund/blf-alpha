'use strict';
const formHelpers = require('./forms');

function init(app) {
    const setViewGlobal = (name, value) => {
        app.get('engineEnv').addGlobal(name, value);
    };

    // a global function for finding errors from a form array
    setViewGlobal('getFormErrorForField', (errorList, fieldName) => {
        if (errorList && errorList.length > 0) {
            return errorList.find(e => e.param === fieldName);
        }
    });

    setViewGlobal('formHelpers', formHelpers);
}

module.exports = {
    init
};
