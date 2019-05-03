'use strict';
const { Op } = require('sequelize');
const moment = require('moment');
const faker = require('faker');
const {
    countBy,
    map,
    maxBy,
    minBy,
    orderBy,
    partition,
    random,
    times
} = require('lodash');

const { SurveyAnswer } = require('../models');
const { purifyUserInput } = require('../modules/validators');

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
    const daysInRange = newestResponseDate
        .startOf('day')
        .diff(oldestResponseDate.startOf('day'), 'days');

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

async function getAllResponses({ path = null } = {}) {
    try {
        const query = { order: [['updatedAt', 'DESC']] };
        if (path) {
            query.where = { path: { [Op.eq]: purifyUserInput(path) } };
        }

        const responses = await SurveyAnswer.findAll(query);

        const [yesResponses, noResponses] = partition(responses, [
            'choice',
            'yes'
        ]);

        const yes = {
            responses: yesResponses,
            voteData: summariseVotes(yesResponses)
        };

        const no = {
            responses: noResponses,
            voteData: summariseVotes(noResponses)
        };

        const toPercentage = count =>
            Math.round((count / responses.length) * 100);
        const totals = {
            totalResponses: responses.length,
            percentageYes: toPercentage(yesResponses.length),
            percentageNo: toPercentage(noResponses.length)
        };

        const pageCounts = orderBy(
            map(countBy(responses, 'path'), (val, key) => ({
                path: key,
                count: val
            })),
            'count',
            'desc'
        );

        return {
            totals,
            yes,
            no,
            pageCounts
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
