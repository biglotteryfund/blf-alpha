'use strict';
const path = require('path');
const express = require('express');

const { Feedback } = require('../../db/models');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const feedback = await Feedback.findAllByDescription();
        res.render(path.resolve(__dirname, './views/feedback'), { feedback });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
