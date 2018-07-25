import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import Vue from 'vue';
import CookieConsent from './components/cookie-consent.vue';
import Feedback from './components/feedback.vue';
import Prompt from './components/prompt.vue';
import Survey from './components/survey.vue';
import materials from './materials';

function initCookieConsent() {
    const cookieEl = document.getElementById('js-cookie-consent');
    if (cookieEl) {
        new Vue({
            el: cookieEl,
            components: { CookieConsent },
            data() {
                return { lang: null };
            },
            created() {
                this.lang = JSON.parse(cookieEl.getAttribute('data-lang'));
            },
            template: `<CookieConsent :lang=lang />`
        });
    }
}

function initSurvey() {
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
}

function initPrompts() {
    const el = document.getElementById('js-active-prompt');
    if (el) {
        new Vue({
            el: el,
            components: { Prompt },
            template: `<Prompt />`
        });
    }
}

function initInlineFeedback() {
    const feedbackEl = document.getElementById('js-feedback');
    if (feedbackEl) {
        new Vue({
            el: feedbackEl,
            components: { 'feedback-form': Feedback }
        });
    }
}

export const init = () => {
    Raven.addPlugin(RavenVue, Vue);

    initCookieConsent();
    initSurvey();
    initPrompts();
    initInlineFeedback();

    materials.init();
};
