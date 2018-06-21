import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import Vue from 'vue';
import feedback from './feedback';
import materials from './materials';
import surveys from './surveys';
import Prompt from './components/prompt.vue';

export const init = () => {
    Raven.addPlugin(RavenVue, Vue);

    surveys.init();
    feedback.init();
    materials.init();

    new Vue({
        el: '#js-active-prompt',
        components: { Prompt },
        template: `<Prompt />`
    });
};
