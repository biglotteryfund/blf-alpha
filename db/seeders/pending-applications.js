'use strict';
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const { Users } = require('../models');
const mockAwardsForAll = require('../../controllers/apply/under10k/mocks');

module.exports = {
    up: async function (queryInterface) {
        const user = await Users.createUser({
            username: `${uuidv4()}@example.com`,
            password: uuidv4(),
            isActive: true,
        });

        const applications = [
            moment().add('30', 'days'),
            moment().add('14', 'days'),
            moment().add('2', 'days'),
            moment(),
            moment().subtract('5', 'days'),
        ].map(function (expiryDate) {
            return {
                id: uuidv4(),
                userId: user.id,
                formId: 'awards-for-all',
                applicationData: JSON.stringify(
                    mockAwardsForAll.mockResponse()
                ),
                submissionAttempts: 0,
                expiresAt: expiryDate.toDate(),
                createdAt: moment().toDate(),
                updatedAt: moment().toDate(),
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
