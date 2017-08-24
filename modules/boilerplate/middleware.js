'use strict';
const app = require('../../server');
const globals = require('./globals');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const i18n = require('i18n-2');
const config = require('config');
const session = require('express-session');
const expressValidator = require('express-validator');
const favicon = require('serve-favicon');
const path = require('path');
const vary = require('vary');
const passport = require('passport');
const flash = require('req-flash');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const models = require('../../models/index');
const secrets = require('../../modules/secrets');
const surveys = require('./getSurveys');

// load auth strategy
require('../../modules/boilerplate/auth');

let sessionSecret = secrets['session.secret'] || process.env.sessionSecret;

app.use(favicon(path.join('public', '/favicon.ico')));
let logFormat = '[:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms';
app.use(morgan(logFormat, {
    skip: (req, res) => {
        // don't log status messages
        return (req.originalUrl === '/status');
    }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser(sessionSecret));

// add session
const sessionConfig = {
    secret: sessionSecret,
    name: config.get('cookies.session'),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: false },
    store: new SequelizeStore({
        db: models.sequelize
    })
};

// create sessions table
sessionConfig.store.sync();

if (app.get('env') === 'production') {
    app.set('trust proxy', 4);
    // sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));
app.use(flash());

// add passport auth
app.use(passport.initialize());
app.use(passport.session());

// add form validator
app.use(expressValidator({}));

// setup internationalisation
i18n.expressBind(app, {
    locales: ['en', 'cy'],
    cookieName: 'locale',
    extension: '.json',
    directory: './config/locales'
});

// handle overlays
app.use((req, res, next) => {
    if (req.flash('showOverlay')) {
        globals.set('showOverlay', true);
    } else {
        globals.set('showOverlay', false);
    }
    next();
});

app.use((req, res, next) => {
    vary(res, 'Cookie');
    next();
});

// inject locale and contrast setting for welsh URLs
app.use((req, res, next) => {
    const WELSH_LOCALE = 'cy';
    const CYMRU_URL = /^\/welsh(\/|$)/;
    const IS_WELSH = (req.url.match(CYMRU_URL) !== null);
    let localePrefix = '';

    if (IS_WELSH) {
        req.i18n.setLocale(WELSH_LOCALE);
        res.setHeader('Content-Language', WELSH_LOCALE);
        localePrefix = config.get('i18n.urlPrefix.cy');
    }

    // store locale prefs globally
    globals.set('locale', req.i18n.getLocale());
    globals.set('localePrefix', localePrefix);

    // get a11y contrast preferences
    let contrastPref = req.cookies[config.get('cookies.contrast')];
    if (contrastPref && contrastPref === 'high') {
        globals.set('highContrast', true);
    } else {
        globals.set('highContrast', false);
    }

    return next();
});

// get any surveys for this page
app.use((req, res, next) => {
    let activeSurveys = surveys.get();
    let currentUrlPath = req.path;

    // normalise URLs (eg. treat a Welsh URL the same as default)
    // @TODO this regex is copied from global.js – refactor!
    const CYMRU_URL = /\/welsh(\/|$)/;
    currentUrlPath = currentUrlPath.replace(CYMRU_URL, '/');

    if (activeSurveys[currentUrlPath]) {
        globals.set('pageSurvey', activeSurveys[currentUrlPath]);
    } else {
        // "remove" the global (nunjucks has no delete method for these)
        globals.set('pageSurvey', false);
    }

    return next();
});
