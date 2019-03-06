import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import Vue from 'vue';

import global from './global';
import formComponents from './form-components';
import grantDetail from './grant-detail';
import pastGrants from './past-grants';
import materials from './materials';

export const init = () => {
    if (window.AppConfig.environment !== 'development') {
        Raven.addPlugin(RavenVue, Vue);
    }

    global.init();

    materials.init();
    formComponents.init();
    const PAST_GRANTS_SESSION_KEY = 'app.pastGrantsFilters';
    grantDetail.init(PAST_GRANTS_SESSION_KEY);
    pastGrants.init(PAST_GRANTS_SESSION_KEY);
};
