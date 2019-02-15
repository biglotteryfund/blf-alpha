import Vue from 'vue';
import FormBudget from './components/form-budget.vue';

function init() {
    const mountEl = document.getElementById('js-vue-form');
    if (!mountEl) {
        return;
    }

    new Vue({
        el: mountEl,
        components: {
            'form-budget': FormBudget
        },
        delimiters: ['<%', '%>'],
        data: {},
        methods: {
            foo: function() {}
        }
    });
}

export default {
    init
};
