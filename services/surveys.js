const { minBy, maxBy, sumBy } = require('lodash');
const moment = require('moment');

const { SurveyResponse } = require('../models');
const contentApi = require('./content-api');

function findAll() {
    // fetch all surveys (expired and live) from API
    const getSurveys = contentApi.getSurveys({
        showAll: true
    });

    // get user responses from the database
    const getResponses = SurveyResponse.findAll({
        order: [['updatedAt', 'DESC']]
    });
    const normalisedDateFormat = 'YYYY-MM-DD';

    // combine the votes with the choices
    return Promise.all([getSurveys, getResponses]).then(responses => {
        const [surveys, votes] = responses;

        // merge the datasets
        let mergedSurveys = surveys.map(survey => {
            // append responses to the relevant choice
            survey.choices = survey.choices.map(choice => {
                // retrieve the votes for this survey's choices
                choice.responses = votes.filter(v => {
                    return v.survey_id === survey.id && v.choice_id === choice.id;
                });

                // fill in gaps for days without votes
                let oldestVote = minBy(choice.responses, 'createdAt');
                let newestVote = maxBy(choice.responses, 'createdAt');

                // calculate votes per day (or substitute with zeroes)
                if (newestVote && oldestVote) {
                    let daysInRange = moment(newestVote.createdAt).diff(moment(oldestVote.createdAt), 'days');

                    // group votes by day to aid in graphing
                    let counts = choice.responses.reduce((acc, response) => {
                        let normalisedDate = moment(response.createdAt).format(normalisedDateFormat);
                        if (!acc[normalisedDate]) {
                            acc[normalisedDate] = 0;
                        }
                        acc[normalisedDate] = acc[normalisedDate] + 1;
                        return acc;
                    }, {});

                    // fill in the gaps based on the complete range
                    let voteData = [];
                    let day = moment(oldestVote.createdAt);
                    for (let i = 0; i <= daysInRange; i++) {
                        let formatted = day.format(normalisedDateFormat);
                        voteData.push({
                            x: formatted,
                            y: counts[formatted] || 0
                        });
                        day = day.add(1, 'days');
                    }
                    // store data for chart output
                    choice.voteData = voteData;
                }

                return choice;
            });

            // work out the winning choice
            let voteTotals = survey.choices.map(choice => {
                return {
                    title: choice.title,
                    votes: choice.responses.length
                };
            });

            // find out the winner's percentage
            let winner = maxBy(voteTotals, 'votes');
            let totalResponses = sumBy(voteTotals, 'votes');
            let winnerPercentage = Math.round(winner.votes / totalResponses * 100);

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
