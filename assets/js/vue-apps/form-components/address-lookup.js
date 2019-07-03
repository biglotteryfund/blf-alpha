'use strict';
import Vue from 'vue';
import forEach from 'lodash/forEach';
import $ from 'jquery';

import AddressLookup from './address-lookup.vue';
import ConditionalRadios from './conditional-radios.vue';

function init() {
    forEach(document.querySelectorAll('.js-address-lookup'), el => {
        new Vue({
            el: el,
            components: {
                'address-lookup': AddressLookup,
                'conditional-radios': ConditionalRadios
            },
            mounted() {
                // Clear out <noscript> fallbacks otherwise they submit as well as the
                // Vue-enhanced fields (eg. double inputs)
                $(this.$el)
                    .find('.js-fallback-only')
                    .remove();
            }
        });
    });
}

export default {
    init
};
