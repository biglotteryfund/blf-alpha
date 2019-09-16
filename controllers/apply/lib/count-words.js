'use strict';

/**
 * Count words
 * Matches consecutive non-whitespace chars
 * If changing match this with word-count.vue
 * @param {string} text
 */
module.exports = function countWords(text) {
    if (text) {
        const tokens = text.trim().match(/\S+/g) || [];
        return tokens.length;
    } else {
        return 0;
    }
};
