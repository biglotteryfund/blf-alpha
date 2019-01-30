/* global AppConfig */
// @ts-nocheck
import 'details-element-polyfill';
import FontFaceObserver from 'fontfaceobserver/fontfaceobserver.js';

function getCommonBodyClasses() {
    const classes = ['js-on'];

    if (AppConfig.isModernBrowser) {
        classes.push('is-modern');
    }

    if (AppConfig.isOldIE) {
        classes.push('is-ie');
    }

    if (AppConfig.hasSeenPageBefore) {
        classes.push('is-repeat-visitor');
    }

    return classes;
}

function addBodyClasses(classes) {
    const docEl = document.documentElement;
    const docClass = docEl.className;
    docEl.className = docClass.replace('no-js', '') + ' ' + classes.join(' ');
}

(function() {
    const LOADED_CLASS = 'fonts-loaded';
    const classes = getCommonBodyClasses();

    if (sessionStorage.fontsLoaded) {
        classes.push(LOADED_CLASS);
        addBodyClasses(classes);
    } else {
        Promise.all([new FontFaceObserver('caecilia').load(), new FontFaceObserver('caecilia-sans-text').load()]).then(
            function() {
                classes.push(LOADED_CLASS);
                addBodyClasses(classes);
                sessionStorage.fontsLoaded = true;
            }
        );
    }
})();
