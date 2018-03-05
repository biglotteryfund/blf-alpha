'use strict';

import raven from './bootstraps/raven';
import common from './bootstraps/common';

raven.init();

common.init();

const vueSplit = () => import(/* webpackChunkName: "vue-components" */ './bootstraps/vue');
vueSplit().then(vueComponents => {
    vueComponents.init();
});

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
