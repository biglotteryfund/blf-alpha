/**
 * Common modules that are run across the site.
 * (Non-Vue components)
 */
import global from '../modules/global';
import tabs from '../modules/tabs';
import heroImages from '../modules/heroImages';
import forms from '../modules/forms';

function init() {
    global.init();
    tabs.init();
    heroImages.init();
    forms.init();
}

export default {
    init
};
