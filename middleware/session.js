'use strict';
const config = require('config');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const { SESSION_SECRET } = require('../common/secrets');
const { isDev } = require('../common/appData');
const { sequelize } = require('../db/models');

module.exports = function(app) {
    const store = new SequelizeStore({ db: sequelize });

    /**
     * Create session table
     */
    store.sync();

    /**
     * Configure session
     */
    const IDLE_TIMEOUT_MINUTES = 60;
    const sessionConfig = {
        store: store,
        name: config.get('cookies.session'),
        secret: SESSION_SECRET,
        rolling: true,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: false,
            secure: isDev === false,
            maxAge: IDLE_TIMEOUT_MINUTES * 60 * 1000
        }
    };

    if (isDev === false) {
        // trust the reverse proxy when securing cookies
        app.set('trust proxy', 4);
        sessionConfig.proxy = true;
    }

    return [cookieParser(SESSION_SECRET), session(sessionConfig)];
};
