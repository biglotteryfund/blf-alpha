'use strict';
const { Op } = require('sequelize');
const { minBy, maxBy, partition, countBy, sortBy } = require('lodash');
const moment = require('moment');

const { SurveyResponse, SurveyAnswer } = require('../models');
const { purifyUserInput } = require('../modules/validators');

// Legacy method. @TODO: Migrate or move me
function findAllLegacyResponses() {
    return SurveyResponse.findAll({
        order: [['updatedAt', 'DESC']]
    }).then(responses => {
        return responses.filter(response => response.message !== null);
    });
}

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
    createResponse,
    getAllResponses,
    findAllLegacyResponses
};
