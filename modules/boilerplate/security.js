'use strict';
const app = require('../../server');
const helmet = require('helmet');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// these URLs won't get the helmet header protection
// @TODO this should only affect the legacy homepage
const pathsExemptFromHelmet = [
    '/'
];

const defaultSecurityDomains = [
    "'self'",
    'fonts.gstatic.com',
    'ajax.googleapis.com',
    'www.google-analytics.com',
    'www.google.com',
    'maxcdn.bootstrapcdn.com',
    'platform.twitter.com'
];

const helmetSettings = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: defaultSecurityDomains,
            frameSrc: defaultSecurityDomains.concat(['www.google.com']),
            styleSrc: defaultSecurityDomains.concat(["'unsafe-inline'", 'fonts.googleapis.com']),
            connectSrc: defaultSecurityDomains.concat(['ws://127.0.0.1:35729/livereload']), // make dev-only?,
            imgSrc: defaultSecurityDomains.concat([]),
            scriptSrc: defaultSecurityDomains.concat(["'unsafe-eval'", "'unsafe-inline'"])
        }
    },
    dnsPrefetchControl: {
        allow: true
    },
    frameguard: {
        action: 'sameorigin'
    },
});

app.use((req, res, next) => {
    if (pathsExemptFromHelmet.indexOf(req.path) !== -1) {
        next();
    } else {
        helmetSettings(req, res, next);
    }
});

module.exports = {
    csrfProtection: csrfProtection
};