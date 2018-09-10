/* eslint-env jest */
'use strict';

describe('createResponse', () => {
    let surveys;

    beforeEach(async () => {
        process.env.DB_CONNECTION_URI = 'sqlite://:memory';
        const models = require('../../models');
        await models.sequelize.sync();
        await models.SurveyAnswer.destroy({ where: {} });
        surveys = require('../surveys');
    });

    it('should create a survey response', async () => {
        const yes = await surveys.createResponse({ choice: 'yes', path: '/' });
        expect(yes.id).toBe(1);
        const no = await surveys.createResponse({ choice: 'no', path: '/about', message: 'Test message' });
        expect(no.id).toBe(2);
    });

    it('should get all responses', async () => {
        await surveys.createResponse({ choice: 'yes', path: '/' });
        await surveys.createResponse({ choice: 'yes', path: '/funding' });
        await surveys.createResponse({ choice: 'no', path: '/about', message: 'Test message' });

        const responses = await surveys.getAllResponses();

        expect(responses.totals.totalResponses).toBe(3);
        expect(responses.totals.percentageYes).toBe(67);
        expect(responses.totals.percentageNo).toBe(33);
        expect(Object.keys(responses.groupedPaths).length).toBe(3);
    });

    it('should get responses for a given path', async () => {
        await surveys.createResponse({ choice: 'yes', path: '/' });
        await surveys.createResponse({ choice: 'yes', path: '/funding' });
        await surveys.createResponse({ choice: 'yes', path: '/funding' });
        await surveys.createResponse({ choice: 'no', path: '/about', message: 'Test message' });

        const responses = await surveys.getAllResponses({ path: '/funding' });

        expect(responses.totals.totalResponses).toBe(2);
        expect(responses.totals.percentageYes).toBe(100);
        expect(responses.totals.percentageNo).toBe(0);
        expect(Object.keys(responses.groupedPaths).length).toBe(1);
    });
});
