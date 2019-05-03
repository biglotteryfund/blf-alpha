'use strict';
const path = require('path');
const express = require('express');

const appData = require('../../modules/appData');
const surveysService = require('../../services/surveys');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const pathQuery = req.query.path;
        const survey = await surveysService.getAllResponses({
            path: pathQuery
        });

        res.render(path.resolve(__dirname, './views/survey'), {
            survey,
            pathQuery
        });
    } catch (error) {
        next(error);
    }
});

if (appData.isDev) {
    router.get('/seed', async (req, res, next) => {
        try {
            const results = await surveysService.mockResponses();
            res.send(`Seeded ${results.length} survey responses`);
        } catch (error) {
            next(error);
        }
    });
}

module.exports = router;
