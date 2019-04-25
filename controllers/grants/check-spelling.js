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

            const suggestions = terms
                .filter(term => term.suggestions.length > 0)
                .reduce((acc, term) => {
                    if (acc.length === 0) {
                        acc = term.suggestions.map(suggestion => searchTerm.replace(term.word, suggestion));
                    } else {
                        acc = acc.map(s => {
                            let fixedSuggestion = s;
                            term.suggestions.forEach(suggestion => {
                                fixedSuggestion = fixedSuggestion.replace(term.word, suggestion);
                            });
                            return fixedSuggestion;
                        });
                    }
                    return acc;
                }, []);

            return resolve({
                hasTypo: terms.some(term => term.isCorrect === false),
                suggestions
            });
        });
    });
};
