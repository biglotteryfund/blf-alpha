'use strict';
const appData = require('./appData');

function shouldServe(page) {
    return appData.isNotProduction ? true : !page.isDraft;
}

function isBilingual(availableLanguages) {
    return availableLanguages.length === 2;
}

module.exports = {
    shouldServe,
    isBilingual
};
