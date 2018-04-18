'use strict';

const { JSDOM } = require('jsdom');
const { mapValues } = require('lodash');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function purifyUserInput(input) {
    return DOMPurify.sanitize(input);
}

/**
 * Middleware wrapper around purifyUserInput
 */
function purify(req, res, next) {
    req.body = mapValues(req.body, purifyUserInput);
    next();
}

function errorTranslator(prefix) {
    return function(prop, replacementKeys = []) {
        return function(value, { req }) {
            const t = `${prefix}.${prop}`;
            const replacements = replacementKeys.map(_ => req.i18n.__(_));
            return replacements.length > 0 ? req.i18n.__(t, replacements) : req.i18n.__(t);
        };
    };
}

module.exports = {
    errorTranslator,
    purifyUserInput,
    purify
};
