'use strict';
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const i18n = require('i18n-2');
const session = require('express-session');
const expressValidator = require('express-validator');

// const favicon = require('serve-favicon');

module.exports = function (app) {
    //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(morgan('dev'));
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
        cookie: { secure: false }
    };

    if (app.get('env') === 'production') {
        app.set('trust proxy', 1);
        sessionConfig.cookie.secure = true;
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

    // inject locale for welsh URLs
    app.use(function(req, res, next) {
        const WELSH_LOCALE = 'cy';
        const CYMRU_URL = /^\/welsh\//;
        const IS_WELSH = (req.url.match(CYMRU_URL) !== null);
        if (IS_WELSH) {
            req.i18n.setLocale(WELSH_LOCALE);
            res.setHeader('Content-Language', WELSH_LOCALE);
        }
        req.app.locals.locale = req.i18n.getLocale();
        app.get('engineEnv').addGlobal('locale', req.app.locals.locale);

        return next();
    });
};