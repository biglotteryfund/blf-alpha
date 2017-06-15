'use strict';
const app = require('../server');
const helmet = require('helmet');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const defaultSecurityDomains = [
    "'self'",
    'fonts.gstatic.com',
    'ajax.googleapis.com',
    'www.google-analytics.com',
    'www.google.com',
    'maxcdn.bootstrapcdn.com',
    'www.biglotteryfund.org.uk'
];

app.use(helmet({
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
}));

module.exports = {
    csrfProtection: csrfProtection
}