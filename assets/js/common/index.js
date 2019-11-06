import forEach from 'lodash/forEach';
import fitvids from 'fitvids';
import tabs from './tabs';
import forms from './forms';
import session from './session';

/**
 * Common modules that are run across the site.
 * (Non-Vue components)
 */
function init() {
    fitvids();

    forEach(
        document.querySelectorAll('.fluid-width-video-wrapper iframe'),
        function(el) {
            el.removeAttribute('style');
        }
    );

    tabs.init();
    forms.init();
    session.init();
}

export default { init };
