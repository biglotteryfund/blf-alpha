import forEach from 'lodash/forEach';
import fitvids from 'fitvids';
import tabs from './modules/tabs';
import forms from './modules/forms';

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

    tabs.init();
    forms.init();
};
