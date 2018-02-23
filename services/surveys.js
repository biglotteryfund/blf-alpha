const { SurveyResponse } = require('../models');
const contentApi = require('./content-api');

function findAll() {

    // fetch all surveys (expired and live) from API
    const getSurveys = contentApi.getSurveys({
        showAll: true
    });

    // get user responses from the database
    const getResponses = SurveyResponse.findAll();

    // combine the two
    return Promise.all([getSurveys, getResponses]).then((responses) => {
        let surveys = responses[0];
        let votes = responses[1];

        // merge the datasets
        return surveys.map(survey => {
            survey.choices = survey.choices.map(choice => {
                choice.responses = votes.filter(v => {
                    return v.survey_id === survey.id && v.choice_id === choice.id;
                });
                return choice;
            });
            return survey;
        });
    });
}

function createResponse(response) {
    return SurveyResponse.create(response);
}

module.exports = {
    findAll,
    createResponse
};
