'use strict';
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

module.exports = function sanitise(input) {
    return DOMPurify.sanitize(input);
};
