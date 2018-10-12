import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import Vue from 'vue';
import CookieConsent from './components/cookie-consent.vue';
import Feedback from './components/feedback.vue';
import Prompt from './components/prompt.vue';
import Survey from './components/survey.vue';

import GrantDetail from './grant-detail';
import materials from './materials';
import pastGrants from './past-grants';

function initCookieConsent() {
    const el = document.getElementById('js-cookie-consent');
    if (el) {
        new Vue({
            el: el,
            components: { 'cookie-consent': CookieConsent }
        });
    }
}

function initSurvey() {
    const el = document.getElementById('js-survey');
    if (el) {
        new Vue({
            el: el,
            components: { survey: Survey }
        });
    }
}

function initPrompts() {
    const el = document.getElementById('js-active-prompt');
    if (el) {
        new Vue({
            el: el,
            components: { prompt: Prompt }
        });
    }
}

function initInlineFeedback() {
    const el = document.getElementById('js-feedback');
    if (el) {
        new Vue({
            el: el,
            components: { 'feedback-form': Feedback }
        });
    }
}

export const init = () => {
    if (window.AppConfig.environment !== 'development') {
        Raven.addPlugin(RavenVue, Vue);
    }

    initCookieConsent();
    initSurvey();
    initPrompts();
    initInlineFeedback();

    materials.init();

    GrantDetail.init();
    pastGrants.init();
};
