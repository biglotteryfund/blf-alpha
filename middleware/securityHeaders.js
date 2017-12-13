'use strict';
const helmet = require('helmet');
const { map } = require('lodash');
const { legacyProxiedRoutes } = require('../controllers/routes');

module.exports = function(environment) {
    /**
     * URLs which should be exempt from security headers
     * Only proxied legacy URLs should be exempt.
     */
    const exemptLegacyUrls = map(legacyProxiedRoutes, _ => _.path);

    const defaultSecurityDomains = [
        "'self'",
        'cdn.polyfill.io',
        'fonts.gstatic.com',
        'ajax.googleapis.com',
        'www.google-analytics.com',
        'www.google.com',
        'maxcdn.bootstrapcdn.com',
        'platform.twitter.com',
        'syndication.twitter.com',
        'cdn.syndication.twimg.com',
        '*.twimg.com',
        '*.youtube.com',
        'cdn.jsdelivr.net',
        'sentry.io',
        'dvmwjbtfsnnp0.cloudfront.net',
        '*.biglotteryfund.org.uk',
        '*.biglotteryfund.local'
    ];

    const directives = {
        defaultSrc: defaultSecurityDomains,
        childSrc: defaultSecurityDomains.concat(['www.google.com']),
        styleSrc: defaultSecurityDomains.concat(["'unsafe-inline'", 'fonts.googleapis.com']),
        connectSrc: defaultSecurityDomains,
        imgSrc: defaultSecurityDomains.concat(['data:', 'localhost', 'stats.g.doubleclick.net']),
        scriptSrc: defaultSecurityDomains.concat(["'unsafe-eval'", "'unsafe-inline'"]),
        reportUri: 'https://sentry.io/api/226416/csp-report/?sentry_key=53aa5923a25c43cd9a645d9207ae5b6c',
        fontSrc: defaultSecurityDomains.concat(['data:'])
    };

    if (environment === 'development') {
        // Allow LiveReload in development
        directives.connectSrc = directives.connectSrc.concat(['ws://127.0.0.1:35729/livereload']);
    }

    const helmetSettings = helmet({
        contentSecurityPolicy: {
            directives: directives,
            browserSniff: false
        },
        dnsPrefetchControl: {
            allow: true
        },
        frameguard: {
            action: 'sameorigin'
        }
    });

    return function(req, res, next) {
        if (exemptLegacyUrls.indexOf(req.path) !== -1) {
            next();
        } else {
            helmetSettings(req, res, next);
        }
    };
};
