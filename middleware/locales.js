'use strict';

const i18n = require('i18n-2');
const yaml = require('js-yaml');
const config = require('config');
const { isWelsh } = require('../modules/urls');

module.exports = function(app) {
    const setViewGlobal = (name, value) => {
        return app.get('engineEnv').addGlobal(name, value);
    };

    // setup internationalisation
    i18n.expressBind(app, {
        locales: ['en', 'cy'],
        directory: './config/locales',
        extension: '.yml',
        parse: data => yaml.safeLoad(data),
        dump: data => yaml.safeDump(data),
        devMode: false
    });

    function viewStateMiddleware(req, res, next) {
        // get a11y contrast preferences
        let contrastPref = req.cookies[config.get('cookies.contrast')];
        res.locals.isHighContrast = contrastPref && contrastPref === 'high';

        if (req.flash('showOverlay')) {
            setViewGlobal('showOverlay', true);
        } else {
            setViewGlobal('showOverlay', false);
        }

        next();
    }

    function localeMiddleware(req, res, next) {
        let localePrefix = '';

        if (isWelsh(req.url)) {
            req.i18n.setLocale('cy');
            res.setHeader('Content-Language', 'cy');
            localePrefix = config.get('i18n.urlPrefix.cy');
        }

        // store locale prefs globally
        res.locals.locale = req.i18n.getLocale();
        setViewGlobal('localePrefix', localePrefix);

        return next();
    }

    // add the request object as a local variable
    // for URL rewriting in templates
    // (eg. locale versions, high-contrast redirect etc)
    function requestMiddleware(req, res, next) {
        res.locals.request = req;
        return next();
    }

    return [viewStateMiddleware, localeMiddleware, requestMiddleware];
};
