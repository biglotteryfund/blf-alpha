'use strict';
const { sampleSize, startsWith } = require('lodash');
const express = require('express');
const uuidv4 = require('uuid/v4');

const { DB_CONNECTION_URI } = require('../../modules/secrets');
const aliases = require('../../controllers/aliases');
const userService = require('../../services/user');

const router = express.Router();

function shouldMount() {
    return process.env.NODE_ENV !== 'production' && startsWith(DB_CONNECTION_URI, 'sqlite://');
}

if (shouldMount()) {
    router.get('/aliases-sample', (req, res) => {
        res.json(sampleSize(aliases, 6));
    });

    router.post('/user', (req, res) => {
        const uuid = uuidv4();
        const newUser = {
            username: `${uuid}@example.com`,
            password: uuid,
            level: 5
        };

        userService.createUser(newUser).then(() => {
            res.json(newUser);
        });
    });
}

module.exports = router;
