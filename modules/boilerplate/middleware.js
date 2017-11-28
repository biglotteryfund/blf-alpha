'use strict';
const app = require('../../server');
const globals = require('./globals');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const i18n = require('i18n-2');
const config = require('config');
const session = require('express-session');
const favicon = require('serve-favicon');
const path = require('path');
const passport = require('passport');
const flash = require('req-flash');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const models = require('../../models/index');
const getSecret = require('../../modules/get-secret');
const routes = require('../../controllers/routes');

// load auth strategy
require('../../modules/boilerplate/auth');

let sessionSecret = process.env.sessionSecret || getSecret('session.secret');

app.use(favicon(path.join('public', '/favicon.ico')));

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
        globals.set('showOverlay', true);
    } else {
        globals.set('showOverlay', false);
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

// get routes / current section
app.use((req, res, next) => {
    globals.set('routes', routes.sections);
    return next();
});

// add the request object as a local variable
// for URL rewriting in templates
// (eg. locale versions, high-contrast redirect etc)
app.use((req, res, next) => {
    res.locals.request = req;
    return next();
});

// redirect non-www links to www
app.use((req, res, next) => {
    let host = req.headers.host;
    let domainProd = 'biglotteryfund.org.uk';
    if (host === domainProd) {
        return res.redirect(301, req.protocol + '://www.' + domainProd + req.originalUrl);
    } else {
        return next();
    }
});
