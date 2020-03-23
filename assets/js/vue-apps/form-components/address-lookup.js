import forEach from 'lodash/forEach';
import $ from 'jquery';
import Vue from 'vue';
import { setupI18n } from '../vue-helpers';

import AddressLookup from './address-lookup.vue';
import ConditionalRadios from './conditional-radios.vue';

function init() {
    forEach(document.querySelectorAll('.js-address-lookup'), (el) => {
        new Vue({
            el: el,
            i18n: setupI18n(Vue),
            components: {
                'address-lookup': AddressLookup,
                'conditional-radios': ConditionalRadios,
            },
            mounted() {
                // Clear out <noscript> fallback otherwise they submit as well as the
                // Vue-enhanced fields (eg. double inputs)
                $(this.$el).find('.js-fallback-only').remove();
            },
        });
    });
}

export default {
    init,
};
