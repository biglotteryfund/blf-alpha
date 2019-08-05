import forEach from 'lodash/forEach';
import Vue from 'vue';
import { setupI18n } from '../vue-helpers';
import WordCount from './word-count.vue';

function init() {
    forEach(document.querySelectorAll('.js-word-count'), el => {
        new Vue({
            el: el,
            i18n: setupI18n(Vue),
            components: {
                'word-count': WordCount
            },
            data: {
                // Assumes a v-model on the input within the component template
                text: null
            },
            mounted() {
                this.text = this.$refs.textarea.value;
            },
            methods: {
                onInput(e) {
                    this.text = e.target.value;
                }
            }
        });
    });
}

export default {
    init
};
