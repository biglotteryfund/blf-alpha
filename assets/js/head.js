// @ts-nocheck
import 'details-element-polyfill';
import FontFaceObserver from 'fontfaceobserver/fontfaceobserver.js';

(function() {
    const docEl = document.documentElement;
    docEl.className = docEl.className.replace('no-js', 'js-on');

    if (
        navigator.userAgent.indexOf('MSIE') !== -1 ||
        navigator.appVersion.indexOf('Trident/') > 0
    ) {
        docEl.className += ' ' + 'is-ie';
    }

    const LOADED_CLASS = 'fonts-loaded';
    if (sessionStorage.fontsLoaded) {
        docEl.className += ' ' + LOADED_CLASS;
    } else {
        const webFontObservers = [
            new FontFaceObserver('caecilia').load(),
            new FontFaceObserver('caecilia-sans-text').load()
        ];

        Promise.all(webFontObservers).then(function() {
            docEl.className += ' ' + LOADED_CLASS;
            sessionStorage.fontsLoaded = true;
        });
    }
})();
