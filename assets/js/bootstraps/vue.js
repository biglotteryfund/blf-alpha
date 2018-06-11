import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import Vue from 'vue';
import feedback from '../vue-components/feedback';
import materials from '../vue-components/materials';
import prompts from '../vue-components/prompts';
import surveys from '../vue-components/surveys';

export const init = () => {
    Raven.addPlugin(RavenVue, Vue);

    if (window.AppConfig.isNotProduction) {
        prompts.init();
    }

    surveys.init();
    feedback.init();
    materials.init();
};
