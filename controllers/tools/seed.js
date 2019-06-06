'use strict';
const express = require('express');
const uuidv4 = require('uuid/v4');
const features = require('config').get('features');

const { Users } = require('../../db/models');

const router = express.Router();

if (features.enableSeeders) {
    router.post('/user', (req, res) => {
        const username = `${uuidv4()}@example.com`;
        const password = uuidv4();

        Users.createUser({
            username: username,
            password: password,
            isActive: true
        }).then(() => {
            res.json({ username, password });
        });
    });
}

module.exports = router;
