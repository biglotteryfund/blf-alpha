'use strict';
const uuid = require('uuid/v4');

const formHelpers = require('./forms');

function getCurrentSection(sectionId, pageId) {
    const isHomepage = sectionId === 'toplevel' && pageId === 'home';
    if (isHomepage) {
        return 'toplevel';
    } else if (sectionId !== 'toplevel') {
        return sectionId;
    }
}

function init(app) {
    const setViewGlobal = (name, value) => {
        app.get('engineEnv').addGlobal(name, value);
    };

    setViewGlobal('uuid', () => uuid());

    setViewGlobal('getCurrentSection', getCurrentSection);

    // a global function for finding errors from a form array
    setViewGlobal('getFormErrorForField', (errorList, fieldName) => {
        if (errorList && errorList.length > 0) {
            return errorList.find(e => e.param === fieldName);
        }
    });

    // utility to get flash messages in templates (this can cause race conditions otherwise)
    setViewGlobal('getFlash', (req, key, innerKey) => {
        if (req && req.flash) {
            if (req.flash(key)) {
                if (!innerKey) {
                    return req.flash(key);
                } else if (req.flash(key)[innerKey]) {
                    return req.flash(key)[innerKey];
                }
            }
        }
    });

    setViewGlobal('formHelpers', formHelpers);
}

module.exports = {
    init,
    getCurrentSection
};
