'use strict';
const helmet = require('helmet');

module.exports = function(app) {
    /**
     * URLs which should be exempt from security headers
     * Only proxied legacy URLs should be exempt.
     */
    const pathsExemptFromHelmet = ['/', '/welsh', '/legacy'];

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
        'cdn.jsdelivr.net',
        'sentry.io',
        'dvmwjbtfsnnp0.cloudfront.net'
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

    if (app.get('env') === 'development') {
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
        if (pathsExemptFromHelmet.indexOf(req.path) !== -1) {
            next();
        } else {
            helmetSettings(req, res, next);
        }
    };
};
