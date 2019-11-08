/**
 * <picture> element support for IE 10-11
 */
import 'picturefill';

/**
 * <details> element support for IE 11
 */
import 'details-element-polyfill';

(function() {
    var docEl = document.documentElement;
    docEl.className = docEl.className.replace('no-js', 'js-on');

    if (
        navigator.userAgent.indexOf('MSIE') !== -1 ||
        navigator.appVersion.indexOf('Trident/') > 0
    ) {
        docEl.className += ' ' + 'is-ie';
    }

    if (sessionStorage.fontsLoaded) {
        docEl.className += ' ' + 'fonts-loaded';
    }
})();
