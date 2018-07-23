/**
 * Common modules that are run across the site.
 * (Non-Vue components)
 */
const global = require('../modules/global');
import tabs from '../modules/tabs';
import heroImages from '../modules/heroImages';
const logos = require('../modules/logos');
import forms from '../modules/forms';

function init() {
    global.init();
    tabs.init();
    heroImages.init();
    logos.init();
    forms.init();
}

export default {
    init
};
