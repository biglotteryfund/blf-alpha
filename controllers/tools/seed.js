'use strict';
const express = require('express');
const uuidv4 = require('uuid/v4');
const features = require('config').get('features');

const { Users } = require('../../db/models');

const router = express.Router();

if (features.enableSeeders) {
    router.post('/user', (req, res) => {
        const uuid = uuidv4();
        const newUser = {
            username: `${uuid}@example.com`,
            password: uuid,
            is_active: true
        };

        Users.createUser(newUser).then(() => {
            res.json(newUser);
        });
    });
}

module.exports = router;
