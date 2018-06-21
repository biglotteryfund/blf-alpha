import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import Vue from 'vue';
import Feedback from './components/feedback.vue';
import Prompt from './components/prompt.vue';
import Survey from './components/survey.vue';
import materials from './materials';

export const init = () => {
    Raven.addPlugin(RavenVue, Vue);

    /**
     * Prompts
     */
    new Vue({
        el: '#js-active-prompt',
        components: { Prompt },
        template: `<Prompt />`
    });

    /**
     * Did you find what you are looking for?
     */
    const surveyEl = document.getElementById('js-survey');
    if (surveyEl) {
        new Vue({
            el: surveyEl,
            components: { Survey },
            data() {
                return { lang: null };
            },
            created() {
                this.lang = JSON.parse(surveyEl.getAttribute('data-lang'));
            },
            template: `<Survey :lang=lang />`
        });
    }

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

    /**
     * Order free materials
     */
    materials.init();
};
