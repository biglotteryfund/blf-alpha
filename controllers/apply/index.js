'use strict';
const express = require('express');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/'));

router.use('/your-idea', require('./reaching-communities'));

router.use('/awards-for-all', require('./awards-for-all'));

module.exports = router;
