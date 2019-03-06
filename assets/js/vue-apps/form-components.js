import Vue from 'vue';
import CharacterCount from './components/character-count.vue';

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

function init() {
    initCharacterCount();
}

export default {
    init
};
