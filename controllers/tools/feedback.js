'use strict';
const path = require('path');
const express = require('express');

const { Feedback } = require('../../db/models');

const router = express.Router();

router.get('/', async function(req, res, next) {
    try {
        const title = 'Feedback results';
        const feedback = await Feedback.findAllByDescription();
        res.render(path.resolve(__dirname, './views/feedback'), {
            title: title,
            breadcrumbs: res.locals.breadcrumbs.concat([{ label: title }]),
            feedback
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
