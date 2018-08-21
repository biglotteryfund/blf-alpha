'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

const feedbackService = require('../../services/feedback');

router.get('/', async (req, res, next) => {
    try {
        const feedback = await feedbackService.findAll();
        res.render(path.resolve(__dirname, './views/feedback'), { feedback });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
