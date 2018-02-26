'use strict';
const helmet = require('helmet');
const { get, map } = require('lodash');
const { legacyProxiedRoutes } = require('../controllers/routes');
const appData = require('../modules/appData');

function withDefaultDirectives(directives) {
    const childSrc = get(directives, 'childSrc', []);
    const styleSrc = get(directives, 'styleSrc', []);
    const connectSrc = get(directives, 'connectSrc', []);
    const imgSrc = get(directives, 'imgSrc', []);
    const scriptSrc = get(directives, 'scriptSrc', []);
    const fontSrc = get(directives, 'scriptSrc', []);

    const fullDirectives = {
        defaultSrc: directives.defaultSrc,
        childSrc: directives.defaultSrc.concat(childSrc),
        styleSrc: directives.defaultSrc.concat(["'unsafe-inline'"]).concat(styleSrc),
        connectSrc: directives.defaultSrc.concat(connectSrc),
        imgSrc: directives.defaultSrc.concat(['data:', 'localhost']).concat(imgSrc),
        scriptSrc: directives.defaultSrc.concat(["'unsafe-eval'", "'unsafe-inline'"]).concat(scriptSrc),
        fontSrc: directives.defaultSrc.concat(['data:']).concat(fontSrc)
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
        'cdn.polyfill.io',
        '*.google.com',
        '*.gstatic.com',
        'www.google-analytics.com',
        'platform.twitter.com',
        'syndication.twitter.com',
        'cdn.syndication.twimg.com',
        '*.twimg.com',
        '*.youtube.com',
        'sentry.io',
        '*.biglotteryfund.org.uk'
    ];

    const directives = {
        defaultSrc: defaultSecurityDomains,
        childSrc: ['www.google.com'],
        styleSrc: ['fonts.googleapis.com'],
        imgSrc: ['stats.g.doubleclick.net'],
        connectSrc: [],
        reportUri: 'https://sentry.io/api/226416/csp-report/?sentry_key=53aa5923a25c43cd9a645d9207ae5b6c'
    };

    if (appData.isDev) {
        directives.imgSrc = directives.imgSrc.concat(['localhost']);
        directives.connectSrc = directives.connectSrc.concat(['ws://127.0.0.1:35729/livereload']);
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
