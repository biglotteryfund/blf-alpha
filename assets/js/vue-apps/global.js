import Vue from 'vue';
import CookieConsent from './components/cookie-consent.vue';
import Feedback from './components/feedback.vue';
import Survey from './components/survey.vue';

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

function initInlineFeedback() {
    const el = document.getElementById('js-feedback');
    if (el) {
        new Vue({
            el: el,
            components: { 'feedback-form': Feedback }
        });
    }
}

function init() {
    initCookieConsent();
    initSurvey();
    initInlineFeedback();
}

export default {
    init
};
