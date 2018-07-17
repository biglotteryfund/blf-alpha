'use strict';
const config = require('config');
const helmet = require('helmet');
const { concat, get } = require('lodash');
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
        imgSrc: ['stats.g.doubleclick.net', config.get('imgix.mediaDomain'), 'placekitten.com'],
        connectSrc: [],
        scriptSrc: [],
        frameSrc: [],
        fontSrc: [],
        reportUri: 'https://sentry.io/api/226416/csp-report/?sentry_key=53aa5923a25c43cd9a645d9207ae5b6c'
    };

    /**
     * Hotjar CSP rules
     * @see https://help.hotjar.com/hc/en-us/articles/115011640307-Content-Security-Policies
     */
    if (config.get('features.useHotjar')) {
        directives.imgSrc = directives.imgSrc.concat(['http://*.hotjar.com', 'https://*.hotjar.com']);
        directives.scriptSrc = directives.scriptSrc.concat([
            'http://*.hotjar.com',
            'https://*.hotjar.com',
            "'unsafe-eval'"
        ]);
        directives.connectSrc = directives.connectSrc.concat([
            'http://*.hotjar.com:*',
            'https://*.hotjar.com:*',
            'ws://*.hotjar.com',
            'wss://*.hotjar.com'
        ]);
        directives.frameSrc = directives.frameSrc.concat(['https://*.hotjar.com']);
        directives.childSrc = directives.childSrc.concat(['https://*.hotjar.com']);
        directives.fontSrc = directives.fontSrc.concat(['http://*.hotjar.com', 'https://*.hotjar.com']);
    }

    if (appData.isDev) {
        directives.imgSrc = directives.imgSrc.concat(['localhost', '127.0.0.1:*']);
        directives.connectSrc = directives.connectSrc.concat(['ws://127.0.0.1:35729/livereload']);
    }

    return buildSecurityMiddleware(directives);
}

function toolsSecurityHeaders() {
    return buildSecurityMiddleware({
        defaultSrc: ['maxcdn.bootstrapcdn.com', 'ajax.googleapis.com', 'cdnjs.cloudflare.com']
    });
}

function stripCSPHeader(req, res, next) {
    if (!res.headersSent) {
        res.removeHeader('Content-Security-Policy');
    }

    next();
}

module.exports = {
    buildSecurityMiddleware,
    defaultSecurityHeaders,
    toolsSecurityHeaders,
    stripCSPHeader
};
