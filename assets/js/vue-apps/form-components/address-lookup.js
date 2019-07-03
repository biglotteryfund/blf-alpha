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
                    showFallbackFields: false,
                    showSummaryLabel: true
                };
            },
            methods: {
                handleAddress(data) {
                    this.showFallbackFields = false;
                    this.showSummaryLabel = false;
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
                    this.showFallbackFields = false;
                    this.showSummaryLabel = true;
                },
                handleFallback() {
                    this.showFallbackFields = true;
                    this.showSummaryLabel = false;
                }
            },
            watch: {
                showFallbackFields() {
                    // Inform the address component when the fallback is toggled
                    // so we can toggle the postcode's required status
                    this.$refs.addressLookup.trackFallbackState(
                        this.showFallbackFields
                    );
                }
            }
        });
    });
}

export default {
    init
};
