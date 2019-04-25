'use strict';
const { max } = require('lodash');
const nspell = require('nspell');
const cyGB = require('dictionary-cy-gb');
const enGB = require('dictionary-en-gb');

module.exports = function checkSpelling({ searchTerm, locale = 'en' }) {
    const dictToUse = locale === 'cy' ? cyGB : enGB;
    return new Promise((resolve, reject) => {
        dictToUse((err, dict) => {
            if (err) {
                return reject(err);
            }

            const spell = nspell(dict);

            const terms = searchTerm.split(' ').map(word => {
                const wordAlphaNumeric = word.replace(/[^a-zA-Z0-9 -]/g, '');
                const isCorrect = spell.correct(wordAlphaNumeric);
                const suggestions = isCorrect ? [] : spell.suggest(wordAlphaNumeric);

                return {
                    word,
                    suggestions,
                    isCorrect
                };
            });

            function buildSuggestions() {
                const permutationLimit = max(terms.map(term => term.suggestions.length));
                const permutations = new Array(permutationLimit).fill(searchTerm);
                const termsWithSuggestions = terms.filter(term => term.suggestions.length > 0);
                return permutations.map((permutation, index) => {
                    termsWithSuggestions.forEach(term => {
                        const replacement = term.suggestions[index] || term.suggestions[0];
                        permutation = permutation.replace(term.word, replacement);
                    });

                    return permutation;
                });
            }

            return resolve({
                hasTypo: terms.some(term => term.isCorrect === false),
                suggestions: buildSuggestions()
            });
        });
    });
};
