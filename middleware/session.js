const cookieParser = require('cookie-parser');
const config = require('config');
const session = require('express-session');
const flash = require('req-flash');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const models = require('../models/index');
const getSecret = require('../modules/get-secret');

module.exports = function(app) {
    const sessionSecret = process.env.sessionSecret || getSecret('session.secret');

    // add session
    const sessionConfig = {
        name: config.get('cookies.session'),
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: { sameSite: true },
        store: new SequelizeStore({
            db: models.sequelize
        })
    };

    // create sessions table
    sessionConfig.store.sync();

    if (app.get('env') !== 'development') {
        app.set('trust proxy', 4);
        sessionConfig.cookie.secure = true;
    }

    return [cookieParser(sessionSecret), session(sessionConfig), flash()];
};
