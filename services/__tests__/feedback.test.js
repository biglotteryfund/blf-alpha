/* eslint-env jest */
'use strict';

describe('createResponse', () => {
    let feedback;

    beforeEach(async () => {
        process.env.DB_CONNECTION_URI = 'sqlite://:memory';
        const models = require('../../models');
        await models.sequelize.sync();
        await models.Feedback.destroy({ where: {} });
        feedback = require('../feedback');
    });

    it('should create a feedback response', async () => {
        const item = await feedback.storeFeedback({ description: 'description', message: 'Test message' });
        expect(item.id).toBe(1);
        expect(item.dataValues.message).toBe('Test message');
    });

    it('should get all responses', async () => {
        await feedback.storeFeedback({ description: 'description 1', message: 'Test message 1' });
        await feedback.storeFeedback({ description: 'description 1', message: 'Test message 2' });
        await feedback.storeFeedback({ description: 'description 2', message: 'Test message 3' });

        const all = await feedback.findAll();
        expect(all['description 1'].length).toBe(2);
        expect(all['description 2'].length).toBe(1);
    });
});
