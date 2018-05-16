'use strict';
const { sampleSize } = require('lodash');
const uuidv4 = require('uuid/v4');
const userService = require('../../services/user');
const appData = require('../../modules/appData');
const aliases = require('../../controllers/aliases');

function shouldMount() {
    return appData.isNotProduction && process.env.USE_LOCAL_DATABASE;
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
