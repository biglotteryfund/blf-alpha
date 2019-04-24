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
        '*.tnlcommunityfund.org.uk',
        '*.google.com',
        '*.facebook.com',
        '*.twitter.com',
        '*.gstatic.com',
        '*.twimg.com',
        '*.youtube.com',
        '*.vimeo.com',
        'cdn.polyfill.io',
        'cdn.syndication.twimg.com',
        'platform.twitter.com',
        'sentry.io',
        'syndication.twitter.com',
        'www.google-analytics.com',
        'use.typekit.net'
    ];

    const directives = {
        defaultSrc: defaultSecurityDomains,
        childSrc: ['www.google.com'],
        styleSrc: ['*.typekit.net'],
        imgSrc: ['stats.g.doubleclick.net', 'via.placeholder.com', 'biglotteryfund-assets.imgix.net'],
        connectSrc: [],
        scriptSrc: [],
        frameSrc: [],
        fontSrc: ['use.typekit.net'],
        reportUri: 'https://sentry.io/api/226416/csp-report/?sentry_key=53aa5923a25c43cd9a645d9207ae5b6c'
    };

    /**
     * Hotjar CSP rules
     * @see https://help.hotjar.com/hc/en-us/articles/115011640307-Content-Security-Policies
     */
    if (config.get('features.enableHotjar')) {
        directives.imgSrc = directives.imgSrc.concat([
            'https://insights.hotjar.com',
            'http://static.hotjar.com',
            'https://static.hotjar.com'
        ]);
        directives.scriptSrc = directives.scriptSrc.concat([
            'http://static.hotjar.com',
            'https://static.hotjar.com',
            'https://script.hotjar.com',
            "'unsafe-eval'",
            "'unsafe-inline'"
        ]);
        directives.connectSrc = directives.connectSrc.concat([
            'http://*.hotjar.com:*',
            'https://*.hotjar.com:*',
            'https://vc.hotjar.io:*',
            'wss://*.hotjar.com'
        ]);
        directives.frameSrc = directives.frameSrc.concat(['https://vars.hotjar.com']);
        directives.childSrc = directives.childSrc.concat(['https://vars.hotjar.com']);
        directives.fontSrc = directives.fontSrc.concat(['http://static.hotjar.com', 'https://static.hotjar.com']);
    }

    /**
     * Allow localhost URLs in non production environments as image sources
     * This allows us to test out local images without publishing them
     */
    if (appData.isNotProduction) {
        directives.imgSrc = directives.imgSrc.concat(['http://localhost', 'http://127.0.0.1:*']);
    }

    /**
     * Allow localhost port connections for http and websockets in development
     * Used primarily for browser-sync to be able to poll and reload assets
     */
    if (appData.isDev) {
        directives.defaultSrc = directives.defaultSrc.concat(['http://localhost:*', 'ws://localhost:*']);
    }

    return buildSecurityMiddleware(directives);
}

module.exports = {
    buildSecurityMiddleware,
    defaultSecurityHeaders
};
