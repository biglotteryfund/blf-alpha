'use strict';
const { Op } = require('sequelize');
const moment = require('moment');
const faker = require('faker');
const {
    countBy,
    groupBy,
    map,
    maxBy,
    minBy,
    orderBy,
    random,
    times
} = require('lodash');

const { SurveyAnswer } = require('../models');
const { purifyUserInput } = require('../modules/validators');

function satisfactionSummary(responses) {
    if (responses.length === 0) {
        return [];
    }

    const oldestResponseDate = moment(minBy(responses, 'createdAt').createdAt);
    const newestResponseDate = moment(maxBy(responses, 'createdAt').createdAt);

    const daysInRange = newestResponseDate
        .startOf('day')
        .diff(oldestResponseDate.startOf('day'), 'days');

    const grouped = groupBy(responses, function(response) {
        return moment(response.createdAt).format('YYYY-MM-DD');
    });

    const voteData = times(daysInRange, function(n) {
        const key = oldestResponseDate
            .clone()
            .add(n, 'days')
            .format('YYYY-MM-DD');

        const responsesForDay = grouped[key] || [];

        const yesResponsesForDay = responsesForDay.filter(function(response) {
            return response.choice === 'yes';
        });

        const yesPercentageForDay = Math.round(
            (yesResponsesForDay.length / responsesForDay.length) * 100
        );

        return {
            x: key,
            y: yesPercentageForDay
        };
    });

    return voteData;
}

async function getAllResponses({ path = null } = {}) {
    try {
        const query = { order: [['updatedAt', 'DESC']] };
        if (path) {
            query.where = { path: { [Op.eq]: purifyUserInput(path) } };
        }

        const responses = await SurveyAnswer.findAll(query);

        const noResponses = responses.filter(function(response) {
            return response.choice === 'no';
        });

        const pageCounts = orderBy(
            map(countBy(responses, 'path'), (val, key) => ({
                path: key,
                count: val
            })),
            'count',
            'desc'
        );

        return {
            totalResponses: responses.length,
            voteData: satisfactionSummary(responses),
            pageCounts: pageCounts,
            noResponses: noResponses
        };
    } catch (error) {
        return error;
    }
}

function createResponse({ choice, path, message }) {
    cleanupOldData();
    return SurveyAnswer.create({
        choice: purifyUserInput(choice),
        path: purifyUserInput(path),
        message: purifyUserInput(message)
    });
}

function mockResponses(count = 50) {
    const promises = times(count, function() {
        const choice = Math.random() > 0.05 ? 'yes' : 'no';
        return SurveyAnswer.create({
            choice: choice,
            path: faker.random.arrayElement(['/', '/funding', '/about']),
            message: choice === 'no' ? faker.lorem.paragraphs(1) : null,
            createdAt: moment()
                .subtract(random(0, 90), 'days')
                .toISOString()
        });
    });

    return Promise.all(promises);
}

function cleanupOldData() {
    return SurveyAnswer.destroy({
        where: {
            createdAt: {
                [Op.lte]: moment()
                    .subtract(3, 'months')
                    .toDate()
            }
        }
    });
}

module.exports = {
    createResponse,
    mockResponses,
    getAllResponses
};
