'use strict';
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


module.exports = function (app) {
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
        name: 'blf-alpha-session',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: false }
    };

    if (app.get('env') === 'production') {
        app.set('trust proxy', 4);
        // sessionConfig.cookie.secure = true;
    }

    app.use(session(sessionConfig));

    // add form validator
    app.use(expressValidator({}));

    // setup internationalisation
    i18n.expressBind(app, {
        locales: ['en', 'cy'],
        cookieName: 'locale',
        extension: '.json'
    });

    app.use(function(req, res, next) {
        vary(res, 'Cookie');
        next();
    });

    // inject locale and contrast setting for welsh URLs
    app.use(function(req, res, next) {
        const WELSH_LOCALE = 'cy';
        const CYMRU_URL = /^\/welsh\//;
        const IS_WELSH = (req.url.match(CYMRU_URL) !== null);
        let localePrefix = '';
        if (IS_WELSH) {
            req.i18n.setLocale(WELSH_LOCALE);
            res.setHeader('Content-Language', WELSH_LOCALE);
            localePrefix = config.get('i18n.urlPrefix.cy');
        }
        req.app.locals.locale = req.i18n.getLocale();
        req.app.locals.localePrefix = localePrefix;
        // @TODO improve this
        app.get('engineEnv').addGlobal('locale', req.app.locals.locale);
        app.get('engineEnv').addGlobal('localePrefix', req.app.locals.localePrefix);

        // get a11y contrast preferences
        let contrastPref = req.cookies[config.get('contrastCookie.name')];
        if (contrastPref && contrastPref === 'high') {
            req.app.locals.highContrast = true;
            app.get('engineEnv').addGlobal('highContrast', true);
        } else {
            req.app.locals.highContrast = false;
            app.get('engineEnv').addGlobal('highContrast', false);
        }

        return next();
    });
};