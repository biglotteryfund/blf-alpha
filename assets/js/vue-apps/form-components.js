import Vue from 'vue';
import CharacterCount from './components/character-count.vue';
import FormBudget from './components/form-budget.vue';

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
    const mountEl = document.getElementById('js-vue-form');
    if (!mountEl) {
        return;
    }

    new Vue({
        el: mountEl,
        components: {
            'form-budget': FormBudget
        },
        delimiters: ['<%', '%>']
    });
}

function init() {
    initCharacterCount();
    initBudgetInput();
}

export default {
    init
};
