'use strict';

/**
 * Initialise Vue
 */
const Vue = require('vue');
Vue.options.delimiters = ['<%', '%>'];
window.Vue = Vue;

/**
 * Bootstraps
 */
const raven = require('./bootstraps/raven');
raven.init(Vue);

/**
 * Load modules
 */
require('./modules/common').init();
require('./modules/tabs').init();
require('./modules/surveys').init();
require('./modules/carousel').init();
require('./modules/heroImages').init();
require('./modules/logos').init();
require('./modules/materials').init();
require('./modules/forms').init();

/**
 * Load enhancements as a separate bundle
 * Dark-launch until ready for launch
 */
if (window.AppConfig.environment !== 'production') {
    import(/* webpackChunkName: "enhanced" */ './bootstraps/enhanced').then(enhanced => {
        enhanced.init();
    });
}

/**
 * If we are in the live environment then load analytics
 * @see metaHeadJS.njk for where App.blockAnalytics is set
 */
if (!window.AppConfig.blockAnalytics) {
    import(/* webpackChunkName: "analytics" */ './bootstraps/analytics').then(analytics => {
        analytics.init();
    });
}
