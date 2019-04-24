'use strict';
import Vue from 'vue';
import forEach from 'lodash/forEach';

import AddressLookup from './address-lookup.vue';

function init() {
    forEach(document.querySelectorAll('.js-address-lookup'), el => {
        new Vue({
            el: el,
            components: {
                'address-lookup': AddressLookup
            },
            data() {
                return {
                    showFallbackFields: false
                };
            },
            methods: {
                handleAddress(data) {
                    this.showFallbackFields = false;
                    this.$refs.address1.value = data.address1;
                    this.$refs.address2.value = data.address2 || '';
                    this.$refs.townCity.value = data.townCity;
                    this.$refs.postcode.value = data.postcode;
                },
                handleFallback() {
                    this.showFallbackFields = true;
                }
            }
        });
    });
}

export default {
    init
};
