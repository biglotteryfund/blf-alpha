const _ = require('lodash');

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
    return Promise.all([getSurveys, getResponses]).then(responses => {
        let surveys = responses[0];
        let votes = responses[1];

        // merge the datasets
        let mergedSurveys = surveys.map(survey => {
            survey.choices = survey.choices.map(choice => {
                choice.responses = votes.filter(v => {
                    return v.survey_id === survey.id && v.choice_id === choice.id;
                });
                return choice;
            });

            let voteTotals = survey.choices.map(choice => {
                return {
                    title: choice.title,
                    votes: choice.responses.length
                };
            });

            let winner = _.maxBy(voteTotals, 'votes');
            let totalResponses = _.sumBy(voteTotals, 'votes');
            let winnerPercentage = Math.round((winner.votes / totalResponses) * 100);

            survey.winner = {
                title: winner.title,
                percentage: winnerPercentage || 0
            };

            survey.totalResponses = totalResponses;

            return survey;
        });

        return mergedSurveys.filter(s => s.totalResponses > 0);
    });
}

function createResponse(response) {
    return SurveyResponse.create(response);
}

module.exports = {
    findAll,
    createResponse
};
