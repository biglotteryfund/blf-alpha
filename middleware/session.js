const cookieParser = require('cookie-parser');
const config = require('config');
const session = require('express-session');
const flash = require('req-flash');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const models = require('../models/index');
const getSecret = require('../modules/get-secret');
const appData = require('../modules/appData');

module.exports = function(app) {
    const sessionSecret = process.env.sessionSecret || getSecret('session.secret');

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
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: true,
            secure: !appData.isDev
        },
        store: store
    };

    return [cookieParser(sessionSecret), session(sessionConfig), flash()];
};
