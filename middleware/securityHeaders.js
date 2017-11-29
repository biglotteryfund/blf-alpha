'use strict';
const helmet = require('helmet');

// these URLs won't get the helmet header protection
// @TODO this should only affect the legacy homepage
const pathsExemptFromHelmet = [
    '/',
    '/welsh',
    '/legacy',
    '/funding/funding-finder',
    '/welsh/funding/funding-finder',
    '/global-content/programmes/england/awards-for-all-england',
    '/welsh/global-content/programmes/england/awards-for-all-england'
];

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

const childSrc = defaultSecurityDomains.concat(['www.google.com']);

const helmetSettings = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: defaultSecurityDomains,
            childSrc: childSrc,
            frameSrc: childSrc,
            styleSrc: defaultSecurityDomains.concat(["'unsafe-inline'", 'fonts.googleapis.com']),
            connectSrc: defaultSecurityDomains.concat(['ws://127.0.0.1:35729/livereload']), // make dev-only?,
            imgSrc: defaultSecurityDomains.concat(['data:', 'localhost', 'stats.g.doubleclick.net']),
            scriptSrc: defaultSecurityDomains.concat(["'unsafe-eval'", "'unsafe-inline'"]),
            reportUri: 'https://sentry.io/api/226416/csp-report/?sentry_key=53aa5923a25c43cd9a645d9207ae5b6c',
            fontSrc: defaultSecurityDomains.concat(['data:'])
        },
        browserSniff: false
    },
    dnsPrefetchControl: {
        allow: true
    },
    frameguard: {
        action: 'sameorigin'
    }
});

module.exports = (req, res, next) => {
    if (pathsExemptFromHelmet.indexOf(req.path) !== -1) {
        next();
    } else {
        helmetSettings(req, res, next);
    }
};
