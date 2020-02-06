'use strict';
const faker = require('faker');
const moment = require('moment');
const random = require('lodash/random');
const times = require('lodash/times');

module.exports = {
    up: async function(queryInterface) {
        const surveyResponses = times(100, function() {
            const choice = Math.random() > 0.05 ? 'yes' : 'no';
            const createdAt = moment()
                .subtract(random(0, 90), 'days')
                .toDate();

            return {
                choice: choice,
                path: faker.random.arrayElement(['/', '/funding', '/about']),
                message: choice === 'no' ? faker.lorem.paragraphs(1) : null,
                createdAt: createdAt,
                updatedAt: createdAt
            };
        });

        return queryInterface.bulkInsert('survey', surveyResponses, {});
    },

    down: function(queryInterface) {
        return queryInterface.bulkDelete('survey', null, {});
    }
};
