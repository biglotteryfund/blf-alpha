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

            let suggestions = [];
            terms.forEach(term => {
                // Build up a list of replaced words (allowing for multiple typos)
                if (term.suggestions.length > 0) {
                    if (suggestions.length === 0) {
                        suggestions = term.suggestions.map(fixedWord => searchTerm.replace(term.word, fixedWord));
                    } else {
                        suggestions = suggestions.map(s => {
                            let fixedSuggestion = s;
                            term.suggestions.forEach(fixedWord => {
                                fixedSuggestion = fixedSuggestion.replace(term.word, fixedWord);
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
