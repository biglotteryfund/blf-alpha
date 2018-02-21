const appData = require('./appData');

function shouldServe(page) {
    return appData.isNotProduction ? true : page.live === true;
}

module.exports = {
    shouldServe
};
