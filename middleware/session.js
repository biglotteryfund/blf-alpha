'use strict';
const config = require('config');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const { SESSION_SECRET } = require('../common/secrets');
const { isDev } = require('../common/appData');
const { sequelize } = require('../db/models');

module.exports = function(app) {
    // const IDLE_TIMEOUT_MINUTES = 120;
    // const SESSION_EXPIRY = IDLE_TIMEOUT_MINUTES * 60 * 1000;
    const SESSION_EXPIRY = 30 * 1000;

    const store = new SequelizeStore({ db: sequelize });

    /**
     * Create session table
     */
    store.sync();

    /**
     * Configure session
     */
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
            maxAge: SESSION_EXPIRY
        }
    };

    if (isDev === false) {
        // trust the reverse proxy when securing cookies
        app.set('trust proxy', 4);
        sessionConfig.proxy = true;
    }

    return session(sessionConfig);
};
