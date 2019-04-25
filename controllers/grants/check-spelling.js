'use strict';
const nspell = require('nspell');
const cyGB = require('dictionary-cy-gb');
const enGB = require('dictionary-en-gb');

module.exports = function checkSpelling({ searchTerm, locale = 'en' }) {
    const dictToUse = locale === 'cy' ? cyGB : enGB;
    return new Promise((resolve, reject) => {
        dictToUse((err, dict) => {
            const alphaNumeric = /[^a-zA-Z0-9 -]/g;
            let hasTypo = false;
            let suggestions = [];

            if (err) {
                return reject(err);
            }
            const spell = nspell(dict);

            searchTerm.split(' ').forEach(word => {
                const wordAlphaNumeric = word.replace(alphaNumeric, '');
                const isCorrect = spell.correct(wordAlphaNumeric);
                const wordSuggestions = isCorrect ? [] : spell.suggest(wordAlphaNumeric);

                if (!hasTypo && !isCorrect) {
                    hasTypo = true;
                }

                // Build up a list of replaced words (allowing for multiple typos)
                if (wordSuggestions.length > 0) {
                    if (suggestions.length === 0) {
                        suggestions = wordSuggestions.map(fixedWord => searchTerm.replace(word, fixedWord));
                    } else {
                        suggestions = suggestions.map(s => {
                            let fixedSuggestion = s;
                            wordSuggestions.forEach(fixedWord => {
                                fixedSuggestion = fixedSuggestion.replace(word, fixedWord);
                            });
                            return fixedSuggestion;
                        });
                    }
                }
            });

            return resolve({
                hasTypo,
                suggestions
            });
        });
    });
};
