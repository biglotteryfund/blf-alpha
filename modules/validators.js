'use strict';

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
    errorTranslator
};
