'use strict';
const { Op } = require('sequelize');
const { minBy, maxBy, partition, sumBy, countBy, sortBy } = require('lodash');
const moment = require('moment');

const { SurveyResponse, SurveyAnswer } = require('../models');
const { purifyUserInput } = require('../modules/validators');
const contentApi = require('./content-api');

function summariseVotes(responses) {
    if (responses.length === 0) {
        return [];
    }

    // Group votes by day to aid in graphing
    const counts = responses.reduce((acc, response) => {
        let normalisedDate = moment(response.createdAt).format('YYYY-MM-DD');
        if (!acc[normalisedDate]) {
            acc[normalisedDate] = 0;
        }
        acc[normalisedDate] = acc[normalisedDate] + 1;
        return acc;
    }, {});

    const oldestResponseDate = moment(minBy(responses, 'createdAt').createdAt);
    const newestResponseDate = moment(maxBy(responses, 'createdAt').createdAt);
    const daysInRange = newestResponseDate.startOf('day').diff(oldestResponseDate.startOf('day'), 'days');

    // Fill in the gaps based on the complete range
    const voteData = [];
    let day = oldestResponseDate;
    for (let i = 0; i <= daysInRange; i++) {
        let formatted = day.format('YYYY-MM-DD');
        voteData.push({
            x: formatted,
            y: counts[formatted] || 0
        });
        day = day.add(1, 'days');
    }

    return voteData;
}

// Legacy method
function findAll() {
    // fetch all surveys (expired and live) from API
    const getSurveys = contentApi.getSurveys({
        showAll: true
    });

    // get user responses from the database
    const getResponses = SurveyResponse.findAll({
        order: [['updatedAt', 'DESC']]
    });

    // combine the votes with the choices
    return Promise.all([getSurveys, getResponses]).then(responses => {
        const [surveys, votes] = responses;
        const mergedSurveys = surveys.map(survey => {
            // append responses to the relevant choice
            survey.choices = survey.choices.map(choice => {
                let surveyVotes = votes.filter(v => v.survey_id === survey.id);

                // retrieve the votes for this survey's choices
                choice.responses = surveyVotes.filter(v => v.choice_id === choice.id);

                choice.voteData = summariseVotes(choice.responses);

                return choice;
            });

            // work out the winning choice
            const voteTotals = survey.choices.map(choice => {
                return {
                    title: choice.title,
                    votes: choice.responses.length
                };
            });

            // find out the winner's percentage
            const winner = maxBy(voteTotals, 'votes');
            const totalResponses = sumBy(voteTotals, 'votes');
            const winnerPercentage = Math.round(winner.votes / totalResponses * 100);

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

async function getAllResponses({ path = null }) {
    try {
        const query = { order: [['updatedAt', 'DESC']] };
        if (path) {
            query.where = { path: { [Op.eq]: purifyUserInput(path) } };
        }

        const responses = await SurveyAnswer.findAll(query);

        const [yesResponses, noResponses] = partition(responses, ['choice', 'yes']);

        const yes = {
            responses: yesResponses,
            voteData: summariseVotes(yesResponses)
        };

        const no = {
            responses: noResponses,
            voteData: summariseVotes(noResponses)
        };

        const toPercentage = count => Math.round(count / responses.length * 100);
        const totals = {
            totalResponses: responses.length,
            percentageYes: toPercentage(yesResponses.length),
            percentageNo: toPercentage(noResponses.length)
        };

        const groupedPaths = countBy(sortBy(responses, 'path'), 'path');

        return {
            totals,
            yes,
            no,
            groupedPaths
        };
    } catch (error) {
        return error;
    }
}

function createResponse(response) {
    return SurveyAnswer.create(response);
}

module.exports = {
    findAll,
    getAllResponses,
    createResponse
};
