'use strict';

const nunjucks = require('nunjucks');
nunjucks.configure('views');

function renderComponentMacro(componentPath, macroName, params) {
    /**
     * Mock any global translation strings.
     * Wherever possible you should avoid requiring context for components
     */
    const context = {
        __(key) {
            return `[i18n:${key}]`;
        }
    };

    const macroParams = JSON.stringify(params, null, 2);
    const macroString = `{%- from "${componentPath}" import ${macroName} with context -%}{{- ${macroName}(${macroParams}) -}}`;
    return new Promise((resolve, reject) => {
        nunjucks.renderString(macroString, context, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

module.exports = {
    renderComponentMacro
};
