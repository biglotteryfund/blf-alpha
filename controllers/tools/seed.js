'use strict';
const { sampleSize, startsWith } = require('lodash');
const uuidv4 = require('uuid/v4');
const userService = require('../../services/user');
const aliases = require('../../controllers/aliases');
const { DB_CONNECTION_URI } = require('../../modules/secrets');

function shouldMount() {
    return process.env.NODE_ENV !== 'production' && startsWith(DB_CONNECTION_URI, 'sqlite://');
}

function init({ router }) {
    if (!shouldMount()) {
        return;
    }

    router.get('/seed/aliases-sample', (req, res) => {
        res.json(sampleSize(aliases, 6));
    });

    router.post('/seed/user', (req, res) => {
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

    return router;
}

module.exports = {
    init
};
