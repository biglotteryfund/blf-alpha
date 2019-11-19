import forEach from 'lodash/forEach';
import fitvids from 'fitvids';
import tabs from './tabs';
import forms from './forms';
import session from './session';
import modal from './modal';

/**
 * Common modules that are run across the site.
 * (Non-Vue components)
 */
export const init = () => {
    fitvids();

    forEach(
        document.querySelectorAll('.fluid-width-video-wrapper iframe'),
        function(el) {
            el.removeAttribute('style');
        }
    );

    // Modal init must come first to allow other modules to use them
    modal.init();
    tabs.init();
    forms.init();
    session.init();
};
