'use strict';
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

            const alphaNumeric = /[^a-zA-Z0-9 -]/g;

            const spell = nspell(dict);

            const terms = searchTerm.split(' ').map(word => {
                const wordAlphaNumeric = word.replace(alphaNumeric, '');
                const isCorrect = spell.correct(wordAlphaNumeric);

                return {
                    word,
                    isCorrect
                };
            });

            let suggestions = [];
            searchTerm.split(' ').forEach(word => {
                const wordAlphaNumeric = word.replace(alphaNumeric, '');
                const isCorrect = spell.correct(wordAlphaNumeric);
                const wordSuggestions = isCorrect ? [] : spell.suggest(wordAlphaNumeric);

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
                hasTypo: terms.some(term => term.isCorrect === false),
                suggestions
            });
        });
    });
};
