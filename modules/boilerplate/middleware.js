'use strict';
const app = require('../../server');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const i18n = require('i18n-2');
const config = require('config');
const session = require('express-session');
const passport = require('passport');
const flash = require('req-flash');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const models = require('../../models/index');
const getSecret = require('../../modules/get-secret');
const routes = require('../../controllers/routes');

const setViewGlobal = (name, value) => {
    return app.get('engineEnv').addGlobal(name, value);
};

// load auth strategy
require('../../modules/boilerplate/auth');

let sessionSecret = process.env.sessionSecret || getSecret('session.secret');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(sessionSecret));

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

app.use(session(sessionConfig));
app.use(flash());

// add passport auth
app.use(passport.initialize());
app.use(passport.session());

// setup internationalisation
i18n.expressBind(app, {
    locales: ['en', 'cy'],
    cookieName: 'locale',
    extension: '.json',
    directory: './config/locales',
    devMode: false
});

// handle overlays
app.use((req, res, next) => {
    if (req.flash('showOverlay')) {
        setViewGlobal('showOverlay', true);
    } else {
        setViewGlobal('showOverlay', false);
    }
    next();
});

// inject locale and contrast setting for welsh URLs
app.use((req, res, next) => {
    const WELSH_LOCALE = 'cy';
    const CYMRU_URL = /^\/welsh(\/|$)/;
    const IS_WELSH = req.url.match(CYMRU_URL) !== null;
    let localePrefix = '';

    if (IS_WELSH) {
        req.i18n.setLocale(WELSH_LOCALE);
        res.setHeader('Content-Language', WELSH_LOCALE);
        localePrefix = config.get('i18n.urlPrefix.cy');
    }

    // store locale prefs globally
    setViewGlobal('locale', req.i18n.getLocale());
    setViewGlobal('localePrefix', localePrefix);

    // get a11y contrast preferences
    let contrastPref = req.cookies[config.get('cookies.contrast')];
    if (contrastPref && contrastPref === 'high') {
        setViewGlobal('highContrast', true);
    } else {
        setViewGlobal('highContrast', false);
    }

    return next();
});

// get routes / current section
app.use((req, res, next) => {
    setViewGlobal('routes', routes.sections);
    return next();
});

// add the request object as a local variable
// for URL rewriting in templates
// (eg. locale versions, high-contrast redirect etc)
app.use((req, res, next) => {
    res.locals.request = req;
    return next();
});
