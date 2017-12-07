'use strict';

function splitPercentages(percentageForTest) {
    return {
        A: (100 - parseFloat(percentageForTest)) / 100,
        B: parseFloat(percentageForTest) / 100
    };
}

module.exports = {
    splitPercentages
};
