'use strict';

/**
 * Initialise Vue
 */
import Vue from 'vue';
window.Vue = Vue;

/**
 * Bootstraps
 */
const raven = require('./bootstraps/raven');
raven.init(Vue);

/**
 * Load modules
 */
import carousel from './modules/carousel';

require('./modules/common').init();
require('./modules/tabs').init();
require('./modules/surveys').init();
require('./modules/heroImages').init();
require('./modules/logos').init();
require('./modules/materials').init();
require('./modules/forms').init();
carousel.init();

/**
 * If we are in the live environment then load analytics
 * @see metaHeadJS.njk for where App.blockAnalytics is set
 */
const analyticsSplit = () => import(/* webpackChunkName: "analytics" */ './bootstraps/analytics');
if (!window.AppConfig.blockAnalytics) {
    analyticsSplit().then(analytics => {
        analytics.init();
    });
}
