'use strict';
const faker = require('faker');
const moment = require('moment');
const random = require('lodash/random');
const times = require('lodash/times');

module.exports = {
    up: async function(queryInterface) {
        const dateRange = times(30, function(i) {
            return moment()
                .subtract(i, 'days')
                .toDate();
        });

        const surveyResponses = dateRange.flatMap(function(date) {
            const choice = Math.random() > 0.05 ? 'yes' : 'no';

            return times(random(1, 20), function() {
                return {
                    choice: choice,
                    path: faker.random.arrayElement([
                        '/',
                        '/funding',
                        '/about'
                    ]),
                    message: choice === 'no' ? faker.lorem.paragraphs(1) : null,
                    createdAt: date,
                    updatedAt: date
                };
            });
        });

        return queryInterface.bulkInsert('survey', surveyResponses, {});
    },

    down: function(queryInterface) {
        return queryInterface.bulkDelete('survey', null, {});
    }
};
