/**
 * Common modules that are run accross the site.
 * (Non-Vue components)
 */
const global = require('../modules/global');
const tabs = require('../modules/tabs');
import heroImages from '../modules/heroImages';
const logos = require('../modules/logos');
import forms from '../modules/forms';
import carousel from '../modules/carousel';
import cookieWarning from '../modules/cookieWarning';

function init() {
    global.init();
    tabs.init();
    heroImages.init();
    logos.init();
    forms.init();
    carousel.init();
    cookieWarning.init();
}

export default {
    init
};
