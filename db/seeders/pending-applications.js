'use strict';
const moment = require('moment');
const times = require('lodash/times');
const sample = require('lodash/sample');
const random = require('lodash/random');
const { v4: uuidv4 } = require('uuid');

const { Users } = require('../models');
const mockAwardsForAll = require('../../controllers/apply/under10k/mocks');

module.exports = {
    up: async function (queryInterface) {
        const user = await Users.createUser({
            username: `${uuidv4()}@example.com`,
            password: uuidv4(),
            isActive: true,
        });

        const applications = times(250, function () {
            const createdAt = moment().subtract(random(0, 30), 'days');
            return {
                id: uuidv4(),
                userId: user.id,
                formId: 'awards-for-all',
                applicationData: JSON.stringify(
                    mockAwardsForAll.mockResponse({
                        projectCountry: sample([
                            'england',
                            'scotland',
                            'northern-ireland',
                            'wales',
                        ]),
                    })
                ),
                submissionAttempts: 0,
                expiresAt: createdAt.clone().add('3', 'month').toDate(),
                createdAt: createdAt.toDate(),
                updatedAt: createdAt.toDate(),
            };
        });

        return queryInterface.bulkInsert(
            'PendingApplications',
            applications,
            {}
        );
    },

    down: function (queryInterface) {
        return queryInterface.bulkDelete('PendingApplications', null, {});
    },
};
