import Vue from 'vue';
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
// Vue components
import surveys from '../vue-components/surveys';
import materials from '../vue-components/materials';

export const init = () => {
    Raven.addPlugin(RavenVue, Vue);
    surveys.init();
    materials.init();
};
