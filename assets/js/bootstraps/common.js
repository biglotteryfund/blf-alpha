/**
 * Common modules that are run across the site.
 * (Non-Vue components)
 */
import fitvids from 'fitvids';
import tabs from '../modules/tabs';
import forms from '../modules/forms';

function init() {
    fitvids();

    tabs.init();
    forms.init();
}

export default {
    init
};
