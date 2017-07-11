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

// load auth strategy
require('../../modules/boilerplate/auth');

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
app.use(cookieParser());

// add session
const sessionConfig = {
    // @TODO re-generate and secure in AWS
    secret: 'gqQpNpuqBVFgnEiXfLvJBGmstieVHPofPkrbnaEEqHyQFmDpsmrVZA6pAcvZzeLQ',
    name: config.get('cookies.session'),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: false }
};

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
// @TODO improve this
app.use((req, res, next) => {
    if (req.session.showOverlay) {
        globals.set('showOverlay', true);
    } else {
        globals.set('showOverlay', false);
    }
    delete req.session.showOverlay;
    next();
});

app.use((req, res, next) => {
    vary(res, 'Cookie');
    next();
});

// inject locale and contrast setting for welsh URLs
app.use((req, res, next) => {
    const WELSH_LOCALE = 'cy';
    const CYMRU_URL = /^\/welsh\//;
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