'use strict';
const config = require('config');
const shortid = require('shortid');

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

    setViewGlobal('shortid', () => shortid());

    setViewGlobal('anchors', config.get('anchors'));

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
