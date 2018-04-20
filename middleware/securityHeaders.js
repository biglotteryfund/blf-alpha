'use strict';

const config = require('config');
const helmet = require('helmet');
const { concat, get, map } = require('lodash');
const { legacyProxiedRoutes } = require('../controllers/routes');
const appData = require('../modules/appData');

function withDefaultDirectives(directives) {
    const { defaultSrc } = directives;
    const directive = prop => get(directives, prop, []);

    const fullDirectives = {
        defaultSrc: defaultSrc,
        baseUri: ["'self'"],
        childSrc: concat(defaultSrc, directive('childSrc')),
        styleSrc: concat(defaultSrc, ["'unsafe-inline'"], directive('styleSrc')),
        connectSrc: concat(defaultSrc, directive('connectSrc')),
        imgSrc: concat(defaultSrc, ['data:', 'localhost'], directive('imgSrc')),
        scriptSrc: concat(defaultSrc, ["'unsafe-eval'", "'unsafe-inline'"], directive('scriptSrc')),
        fontSrc: concat(defaultSrc, ['data:'], directive('fontSrc'))
    };

    if (directives.reportUri) {
        fullDirectives.reportUri = directives.reportUri;
    }

    return fullDirectives;
}

function buildSecurityMiddleware(cspDirectives) {
    return helmet({
        contentSecurityPolicy: {
            directives: withDefaultDirectives(cspDirectives),
            browserSniff: false
        },
        dnsPrefetchControl: {
            allow: true
        },
        frameguard: {
            action: 'sameorigin'
        }
    });
}

function defaultSecurityHeaders() {
    /**
     * URLs which should be exempt from security headers
     * Only proxied legacy URLs should be exempt.
     */
    const exemptLegacyUrls = map(legacyProxiedRoutes, _ => _.path);

    const defaultSecurityDomains = [
        "'self'",
        '*.biglotteryfund.org.uk',
        '*.google.com',
        '*.gstatic.com',
        '*.twimg.com',
        '*.youtube.com',
        'cdn.polyfill.io',
        'cdn.syndication.twimg.com',
        'platform.twitter.com',
        'sentry.io',
        'syndication.twitter.com',
        'www.google-analytics.com'
    ];

    const directives = {
        defaultSrc: defaultSecurityDomains,
        childSrc: ['www.google.com'],
        styleSrc: ['fonts.googleapis.com'],
        imgSrc: ['stats.g.doubleclick.net', config.get('imgix.mediaDomain')],
        connectSrc: [],
        reportUri: 'https://sentry.io/api/226416/csp-report/?sentry_key=53aa5923a25c43cd9a645d9207ae5b6c'
    };

    if (appData.isDev) {
        directives.imgSrc = directives.imgSrc.concat(['localhost', '127.0.0.1:*']);
        directives.connectSrc = directives.connectSrc.concat(['ws://127.0.0.1:35729/livereload']);
    }

    if (config.get('hotjarEnabled')) {
        directives.connectSrc = directives.connectSrc.concat(['wss://*.hotjar.com']);
        directives.defaultSrc = directives.defaultSrc.concat(['*.hotjar.com']);
    }

    const helmetSettings = buildSecurityMiddleware(directives);

    return function(req, res, next) {
        if (exemptLegacyUrls.indexOf(req.path) !== -1) {
            next();
        } else {
            helmetSettings(req, res, next);
        }
    };
}

function toolsSecurityHeaders() {
    const helmetSettings = buildSecurityMiddleware({
        defaultSrc: ['maxcdn.bootstrapcdn.com', 'ajax.googleapis.com', 'cdnjs.cloudflare.com']
    });

    return helmetSettings;
}

function stripCSPHeader(req, res, next) {
    res.removeHeader('Content-Security-Policy');
    next();
}

module.exports = {
    buildSecurityMiddleware,
    defaultSecurityHeaders,
    toolsSecurityHeaders,
    stripCSPHeader
};
