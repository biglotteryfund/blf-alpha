'use strict';
const { startsWith } = require('lodash');
const express = require('express');
const uuidv4 = require('uuid/v4');

const { DB_CONNECTION_URI } = require('../../common/secrets');
const userService = require('../../services/user');

const router = express.Router();

if (process.env.NODE_ENV !== 'production' && startsWith(DB_CONNECTION_URI, 'sqlite://')) {
    router.post('/user', (req, res) => {
        const uuid = uuidv4();
        const newUser = {
            username: `${uuid}@example.com`,
            password: uuid,
            is_active: true
        };

        userService.createUser(newUser).then(() => {
            res.json(newUser);
        });
    });
}

module.exports = router;
