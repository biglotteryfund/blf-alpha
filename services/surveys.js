const { SurveyResponse } = require('../models');

function findAll() {
    //    @TODO
}

function createResponse(response) {
    return SurveyResponse.create(response);
}

module.exports = {
    findAll,
    createResponse
};
