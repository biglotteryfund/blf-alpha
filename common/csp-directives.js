'use strict';
const { concat } = require('lodash');
let { CONTENT_API_URL } = require('./secrets');

module.exports = function cspDirectives({
    enableHotjar = false,
    allowLocalhost = false
} = {}) {
    let defaultSrc = [
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
        'maxcdn.bootstrapcdn.com',
        'ajax.googleapis.com',
        'cdnjs.cloudflare.com',
        'platform.twitter.com',
        'sentry.io',
        'syndication.twitter.com',
        'www.google-analytics.com',
        'use.typekit.net',
        new URL(CONTENT_API_URL).host
    ];

    if (allowLocalhost) {
        /**
         * Allow localhost connections in development
         */
        defaultSrc = defaultSrc.concat([
            'http://127.0.0.1:*',
            'http://localhost:*',
            'ws://localhost:*'
        ]);
    }

    const directives = {
        defaultSrc: defaultSrc,
        baseUri: ["'self'"],
        imgSrc: concat(defaultSrc, [
            'data:',
            'localhost',
            'stats.g.doubleclick.net',
            'via.placeholder.com',
            'biglotteryfund-assets.imgix.net'
        ]),
        fontSrc: concat(defaultSrc, ['data:', 'use.typekit.net']),
        styleSrc: concat(defaultSrc, ["'unsafe-inline'", '*.typekit.net']),
        scriptSrc: concat(defaultSrc, ["'unsafe-eval'", "'unsafe-inline'"]),
        childSrc: concat(defaultSrc, ['www.google.com']),
        connectSrc: defaultSrc,
        frameSrc: defaultSrc,
        reportUri: `https://sentry.io/api/226416/csp-report/?sentry_key=53aa5923a25c43cd9a645d9207ae5b6c`
    };

    /**
     * Hotjar CSP rules
     * @see https://help.hotjar.com/hc/en-us/articles/115011640307-Content-Security-Policies
     */
    if (enableHotjar === true) {
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
        directives.frameSrc = directives.frameSrc.concat([
            'https://vars.hotjar.com'
        ]);
        directives.childSrc = directives.childSrc.concat([
            'https://vars.hotjar.com'
        ]);
        directives.fontSrc = directives.fontSrc.concat([
            'http://static.hotjar.com',
            'https://static.hotjar.com'
        ]);
    }

    return directives;
};
