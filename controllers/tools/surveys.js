'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');

const appData = require('../../modules/appData');
const surveysService = require('../../services/surveys');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const survey = await surveysService.summarise(req.query.path);

        const title = 'Surveys';
        const breadcrumbs = concat(res.locals.breadcrumbs, [{ label: title }]);

        res.render(path.resolve(__dirname, './views/survey'), {
            title: title,
            breadcrumbs: breadcrumbs,
            survey: survey,
            pathQuery: req.query.path
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
