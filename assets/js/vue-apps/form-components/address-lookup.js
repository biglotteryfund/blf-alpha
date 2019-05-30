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
                    this.$refs.addressLine1.value = data.line1;
                    this.$refs.addressLine2.value = data.line2 || '';
                    this.$refs.townCity.value = data.townCity;
                    this.$refs.county.value = data.county;
                    this.$refs.postcode.value = data.postcode;
                },
                clearAddress() {
                    this.$refs.addressLine1.value = null;
                    this.$refs.addressLine2.value = null;
                    this.$refs.townCity.value = null;
                    this.$refs.county.value = null;
                    this.$refs.postcode.value = null;
                    this.handleFallback();
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
