import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import Vue from 'vue';
import Feedback from './components/feedback.vue';
import Prompt from './components/prompt.vue';
import materials from './materials';
import surveys from './surveys';

export const init = () => {
    Raven.addPlugin(RavenVue, Vue);

    surveys.init();
    materials.init();

    /**
     * Prompts
     */
    new Vue({
        el: '#js-active-prompt',
        components: { Prompt },
        template: `<Prompt />`
    });

    /**
     * Inline feedback
     */
    const feedbackEl = document.getElementById('js-feedback');
    if (feedbackEl) {
        new Vue({
            el: feedbackEl,
            components: { 'feedback-form': Feedback }
        });
    }
};
