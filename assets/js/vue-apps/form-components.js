import Vue from 'vue';
import $ from 'jquery';

import CharacterCount from './components/character-count.vue';
import BudgetInput from './components/budget-input.vue';

function initCharacterCount() {
    const el = document.querySelector('.js-character-count');
    if (el) {
        new Vue({
            el: el,
            data: {
                // Assumes a v-model on the input within the component template
                text: null
            },
            components: {
                'character-count': CharacterCount
            }
        });
    }
}

function initBudgetInput() {
    const el = document.getElementById('js-budget-input');
    if (el) {
        new Vue({
            el: el,
            components: {
                'budget-input': BudgetInput
            },
            mounted: function() {
                // Prevent the Enter key from submitting the entire form
                // if pressed inside a budget field
                $(this.$el).on('keypress', 'input', function(event) {
                    return event.keyCode !== 13;
                });

                // Clear out <noscript> fallbacks otherwise they submit as well as the
                // Vue-enhanced fields (eg. double inputs)
                $(this.$el)
                    .find('.js-fallback-only')
                    .remove();
            }
        });
    }
}

function init() {
    initCharacterCount();
    initBudgetInput();
}

export default {
    init
};
