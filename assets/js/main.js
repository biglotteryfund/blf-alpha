import './config';
import raven from './bootstraps/raven';
import common from './bootstraps/common';
import { featureIsEnabled } from './helpers/features';

raven.init();

common.init();

const vueSplit = () => import(/* webpackChunkName: "vue-components" */ './bootstraps/vue');
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

/**
 * Load HotJar if enabled
 */
if (featureIsEnabled('hotjar')) {
    (function(h, o, t, j, a, r) {
        h.hj =
            h.hj ||
            function() {
                (h.hj.q = h.hj.q || []).push(arguments);
            };
        h._hjSettings = { hjid: 828894, hjsv: 6 };
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script');
        r.async = 1;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
}
