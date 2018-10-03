import './config';
import raven from './bootstraps/raven';
import common from './bootstraps/common';
import { featureIsEnabled } from './helpers/features';

raven.init();

common.init();

const vueSplit = () => import(/* webpackChunkName: "vue-components" */ './vue-apps/index');
vueSplit().then(vueComponents => {
    vueComponents.init();
});

/**
 * Load analytics if enabled
 */
const analyticsSplit = () => import(/* webpackChunkName: "analytics" */ './bootstraps/analytics');
if (featureIsEnabled('analytics')) {
    analyticsSplit().then(analytics => {
        analytics.init();
    });
}
