'use strict';

const i18n = require('i18n-2');
const yaml = require('js-yaml');
const config = require('config');
const { LOCALE_WELSH, isWelshUrl } = require('../services/locales');

module.exports = function(app) {
    /**
     * i18n Setup
     */
    i18n.expressBind(app, {
        locales: ['en', 'cy'],
        directory: './config/locales',
        extension: '.yml',
        parse: data => yaml.safeLoad(data),
        dump: data => yaml.safeDump(data),
        devMode: false
    });

    return function middleware(req, res, next) {
        let localePrefix = '';

        if (isWelshUrl(req.url)) {
            req.i18n.setLocale(LOCALE_WELSH);
            res.setHeader('Content-Language', LOCALE_WELSH);
            localePrefix = config.get('i18n.urlPrefix.cy');
        }

        /**
         * Store locale prefs as view globals
         */
        const engineEnv = app.get('engineEnv');
        engineEnv.addGlobal('locale', req.i18n.getLocale());
        engineEnv.addGlobal('localePrefix', localePrefix);

        next();
    };
};
