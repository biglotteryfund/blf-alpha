// @ts-nocheck
import $ from 'jquery';
import Vue from 'vue';
import { setupI18n } from '../vue-helpers';
import BudgetInput from './budget-input.vue';

function init() {
    const el = document.getElementById('js-budget-input');
    if (el) {
        new Vue({
            el: el,
            i18n: setupI18n(Vue),
            components: {
                'budget-input': BudgetInput
            },
            mounted: function() {
                // Prevent the Enter key from submitting the entire form
                // if pressed inside a budget field
                $(this.$el).on('keypress', 'input', function(event) {
                    return event.keyCode !== 13;
                });

                // Clear out <noscript> fallback otherwise they submit as well as the
                // Vue-enhanced fields (eg. double inputs)
                $(this.$el)
                    .find('.js-fallback-only')
                    .remove();
            }
        });
    }
}

export default {
    init
};
