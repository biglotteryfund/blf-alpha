const config = require('config');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const { SESSION_SECRET } = require('../modules/secrets');
const appData = require('../modules/appData');
const models = require('../models');

module.exports = function(app) {
    if (!appData.isDev) {
        app.set('trust proxy', 4);
    }

    const store = new SequelizeStore({
        db: models.sequelize
    });

    // create sessions table
    store.sync();

    // add session
    const sessionConfig = {
        name: config.get('cookies.session'),
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: true,
            secure: !appData.isDev
        },
        store: store
    };

    return [cookieParser(SESSION_SECRET), session(sessionConfig)];
};
