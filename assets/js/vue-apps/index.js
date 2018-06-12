import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import Vue from 'vue';
import materials from './materials';
import FeedbackForm from './components/feedback.vue';
import Prompt from './components/Prompt.vue';
import Survey from './components/survey.vue';

export const init = () => {
    Raven.addPlugin(RavenVue, Vue);

    /**
     * Order free materials
     */
    materials.init();

    /**
     * Prompts: global pop-over prompt message
     */
    if (window.AppConfig.isNotProduction) {
        new Vue({
            el: '#js-active-prompt',
            template: `<Prompt />`,
            components: { Prompt }
        });
    }

    /**
     * Did you find what you are looking for?
     */
    new Vue({
        el: '#js-survey',
        template: `<Survey />`,
        components: { Survey }
    });

    /**
     * Inline feedback
     */
    const feedbackEl = document.getElementById('js-feedback');
    if (feedbackEl) {
        new Vue({
            el: feedbackEl,
            components: { 'feedback-form': FeedbackForm }
        });
    }
};
