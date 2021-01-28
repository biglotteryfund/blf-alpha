import './config';
import * as Sentry from '@sentry/browser';
import { Vue as SentryVue } from '@sentry/integrations';
import Vue from 'vue';
import FontFaceObserver from 'fontfaceobserver/fontfaceobserver.standalone.js';
import analytics from './analytics';

Sentry.init({
    dsn: 'https://53aa5923a25c43cd9a645d9207ae5b6c@sentry.io/226416',
    environment: window.AppConfig.environment,
    ignoreErrors: [
        'fb_xd_fragment',
        /ReferenceError:.*/,
        // Error generated by a autofill function of Chrome for iOS
        // https://github.com/getsentry/sentry/issues/5267
        /Blocked a frame with origin/,
        // Frequent error caused by slow connections loading webpack code-split chunks
        // The only real fix is to reload the page when this happens but the site
        // remains functional and usable without JavaScript in any case
        /ChunkLoadError/,
    ],
    integrations(integrations) {
        // eslint-disable-next-line
        if (process.env.NODE_ENV === 'production') {
            integrations.push(new SentryVue({ Vue }));
        }
        return integrations;
    },
});

if (!sessionStorage.fontsLoaded) {
    Promise.all([
        new FontFaceObserver('caecilia').load(),
        new FontFaceObserver('caecilia-sans-text').load(),
    ])
        .then(function () {
            document.documentElement.className += ' ' + 'fonts-loaded';
            sessionStorage.fontsLoaded = true;
        })
        .catch((error) => {
            Sentry.withScope((scope) => {
                scope.setLevel('info');
                scope.setContext('message', error);
                Sentry.captureMessage('Fonts failed to load');
            });
        });
}

import(/* webpackChunkName: "common" */ './common/index').then((common) => {
    common.init();
});

import(/* webpackChunkName: "vue-apps" */ './vue-apps/index').then(
    (vueApps) => {
        vueApps.init();
    }
);

function shouldInitAnalytics() {
    const isDoNotTrack =
        window.doNotTrack === '1' ||
        window.navigator.doNotTrack === '1' ||
        window.navigator.msDoNotTrack === '1';

    // If the user hasn't consented to all cookies, we don't enable GA or other tracking.
    if(sessionStorage.getItem('tnlcommunityfund:cookie-consent') != 'all')
        return false;

    if (window.AppConfig.environment === 'production') {
        /*
         * In production, disable analytics outside
         * of the real domain to avoid polluting data.
         */
        return (
            window.location.hostname === 'www.tnlcommunityfund.org.uk' &&
            isDoNotTrack === false
        );
    } else {
        return isDoNotTrack === false;
    }
}

if (shouldInitAnalytics() === true) {
    analytics.init();
}
