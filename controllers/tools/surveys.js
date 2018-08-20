'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

const surveysService = require('../../services/surveys');

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

module.exports = router;
