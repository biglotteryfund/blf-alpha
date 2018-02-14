const appData = require('./appData');

const shouldServe = isLive => appData.isNotProduction ? true : isLive;

module.exports = {
    shouldServe
};
