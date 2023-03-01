'use strict';
const { isNotProduction } = require('./appData');
const { CONTENT_API_URL } = require('./secrets');

module.exports = function cspDirectives() {
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
        'ajax.googleapis.com',
        'cdnjs.cloudflare.com',
        'platform.twitter.com',
        'sentry.io',
        'syndication.twitter.com',
        'www.google-analytics.com',
        'use.typekit.net',
        '*.bootstrapcdn.com',
        '*.soundcloud.com',
        'emails-tnlcommunityfund.org.uk',
        'api.reciteme.com',
        'stats.reciteme.com',
        new URL(CONTENT_API_URL).host,
    ];

    if (isNotProduction) {
        /**
         * Allow localhost connections
         */
        defaultSrc = defaultSrc.concat([
            'http://127.0.0.1:*',
            'http://localhost:*',
            'ws://localhost:*',
        ]);
    }

    const directives = {
        defaultSrc: defaultSrc,
        baseUri: ["'self'"],
        imgSrc: defaultSrc.concat([
            'data:',
            'localhost',
            'stats.g.doubleclick.net',
            'via.placeholder.com',
            'biglotteryfund-assets.imgix.net',
            'i.ytimg.com',
        ]),
        fontSrc: defaultSrc.concat(['data:', 'use.typekit.net']),
        styleSrc: defaultSrc.concat(["'unsafe-inline'", '*.typekit.net']),
        scriptSrc: defaultSrc.concat(["'unsafe-eval'", "'unsafe-inline'"]),
        childSrc: defaultSrc.concat(['www.google.com']),
        connectSrc: defaultSrc,
        frameSrc: defaultSrc,
        reportUri: `https://sentry.io/api/226416/csp-report/?sentry_key=53aa5923a25c43cd9a645d9207ae5b6c`,
    };

    /**
     * Hotjar CSP rules
     * @see https://help.hotjar.com/hc/en-us/articles/115011640307-Content-Security-Policies
     */
    directives.imgSrc = directives.imgSrc.concat([
        'http://*.hotjar.com',
        'https://*.hotjar.com',
        'http://*.hotjar.io',
        'https://*.hotjar.io',
    ]);
    directives.scriptSrc = directives.scriptSrc.concat([
        'http://*.hotjar.com',
        'https://*.hotjar.com',
        'http://*.hotjar.io',
        'https://*.hotjar.io',
    ]);
    directives.connectSrc = directives.connectSrc.concat([
        'http://*.hotjar.com:*',
        'https://*.hotjar.com:*',
        'http://*.hotjar.io',
        'https://*.hotjar.io',
        'wss://*.hotjar.com',
    ]);
    directives.frameSrc = directives.frameSrc.concat([
        'https://*.hotjar.com',
        'http://*.hotjar.io',
        'https://*.hotjar.io',
    ]);
    directives.childSrc = directives.childSrc.concat([
        'https://vars.hotjar.com',
    ]);
    directives.fontSrc = directives.fontSrc.concat([
        'http://*.hotjar.com',
        'https://*.hotjar.com',
        'http://*.hotjar.io',
        'https://*.hotjar.io',
    ]);

    return directives;
};
