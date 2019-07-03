<script>
import $ from 'jquery';
import compact from 'lodash/compact';

import AddressLine from './address-line.vue';
import { trackEvent } from '../../helpers/metrics';

const states = {
    NotAsked: 'NotAsked',
    NotRequired: 'NotRequired',
    AlreadyAnswered: 'AlreadyAnswered',
    Editing: 'Editing',
    Asking: 'Asking',
    Loading: 'Loading',
    Failure: 'Failure',
    Success: 'Success'
};

export default {
    components: { AddressLine },
    props: {
        locale: { type: String, default: 'en' },
        address: { type: String, default: null },
        fieldName: { type: String, default: null },
        label: { type: String, default: null },
        explanation: { type: String, default: null }
    },
    data() {
        return {
            showFallbackFields: false,
            currentAddress: null,
            postcode: null,
            currentState: states.NotAsked,
            states: states,
            fullAddress: {
                line1: null,
                line2: null,
                townCity: null,
                county: null,
                postcode: null
            },
            fullAddressPreview: '',
            addressData: [],
            candidates: [],
            selectedAddressId: '',
            fallbackVisible: null
        };
    },
    mounted() {
        this.$root.$on('update:conditionalRadio', (value) => {
            if (value === 'yes') {
                this.currentState = states.NotRequired;
            } else if (this.fullAddress) {
                this.currentState = this.states.AlreadyAnswered;
            } else {
                this.currentState = states.NotAsked;
            }
        });

        if (this.address) {
            try {
                const addressParts = JSON.parse(this.address);
                // Ensure a blank address doesn't trigger AlreadyAsked state
                if (addressParts && addressParts.postcode) {
                    this.currentAddress = addressParts;
                    const fullAddress = {
                        line1: this.currentAddress.line1,
                        line2: this.currentAddress.line2,
                        townCity: this.currentAddress.townCity,
                        county: this.currentAddress.county,
                        postcode: this.currentAddress.postcode
                    };
                    this.updateAddressPreview(fullAddress);
                }
            } catch (e) {} // eslint-disable-line no-empty
        }

        const $form = $(this.$el).parents('form').find('input[type="submit"]');
        const that = this;
        $form.on('click', function(e) {
            if (that.candidates.length === 0 && !that.showFallbackFields && that.postcode) {
                // @TODO i18n
                alert(`Please click "Find address" and choose an address from the list.`);
                trackEvent('Form warning', 'Postcode lookup', 'Typed but not submitted');
                document.querySelector('.address-lookup').scrollIntoView();
                // Prevent form submission (for nested)
                return false;
            }
        });
    },
    methods: {
        getAddressFromId(udprn) {
            return this.addressData.find(_ => _.udprn === udprn);
        },
        formatAddress(address) {
            if (address) {
                return {
                    line1: address.line_1,
                    line2: address.line_2,
                    townCity: address.post_town,
                    county: address.county,
                    postcode: address.postcode
                };
            }
        },
        handleFailure() {
            // Handle case of no results for search
            this.currentState = this.states.Failure;
            this.handleFallback();
        },
        handleLookup() {
            if (!this.formIsValid) {
                return;
            }
            this.currentState = this.states.Loading;

            this.fullAddress = null;
            this.candidates = [];
            this.addressData = [];
            this.selectedAddressId = null;

            const token = document.querySelector('input[name="_csrf"]').value;
            $.ajax({
                type: 'post',
                url: '/api/address-lookup',
                dataType: 'json',
                headers: {
                    'CSRF-Token': token
                },
                data: { q: this.postcode }
            })
                .then(response => {
                    if (response.addresses.length > 0) {
                        this.currentState = this.states.Success;
                        this.addressData = response.addresses;
                        this.candidates = this.addressData.map(result => {
                            const label = compact([
                                result['line_1'],
                                result['line_2'],
                                result['post_town'],
                                result['county']
                            ]).join(', ');
                            return { value: result.udprn, label: label };
                        });
                    } else {
                        this.handleFailure();
                    }
                })
                .fail(() => {
                    this.handleFailure();
                });
        },
        clearState() {
            this.postcode = null;
            this.candidates = [];
            this.addressData = [];
            this.fullAddress = null;
            this.showFallbackFields = false;
        },
        removeAddress() {
            this.currentState = this.states.Asking;
            this.clearState();
            this.showFallbackFields = false;
        },
        handleFallback() {
            this.clearState();
            this.showFallbackFields = true;
        },
        startEditing() {
            this.currentState = this.states.Editing;
            this.showFallbackFields = true;
        },
        finishEditing() {
            this.currentState = this.states.AlreadyAnswered;
            this.showFallbackFields = false;
        },
        updateAddressPreview(fullAddress) {
            if (fullAddress) {
                this.showFallbackFields = false;
                this.currentState = this.states.AlreadyAnswered;
                this.fullAddress = fullAddress;
            }
        }
    },
    watch: {
        selectedAddressId() {
            if (this.selectedAddressId) {
                this.currentState = this.states.Success;
                const address = this.getAddressFromId(this.selectedAddressId);
                if (address) {
                    this.updateAddressPreview(this.formatAddress(address));
                }
            }
        },
        fullAddress: {
            handler() {
                this.fullAddressPreview = this.fullAddress
                    ? compact([
                        this.fullAddress.line1,
                        this.fullAddress.line2,
                        this.fullAddress.townCity,
                        this.fullAddress.postcode
                    ]).join('<br />')
                    : '';
            },
            deep: true
        }
    },
    computed: {
        fieldsAreRequired() {
            return (
                !this.showFallbackFields &&
                this.shouldShowPostcodeLookup
            );
        },
        shouldShowPostcodeLookup() {
            return (
                this.currentState === this.states.Asking ||
                this.currentState === this.states.NotAsked ||
                this.currentState === this.states.Success ||
                this.currentState === this.states.Loading
            );
        },
        formIsValid() {
            const VALIDATION_REGEX = /^[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}$/i;
            return (
                this.postcode &&
                this.postcode.trim().match(VALIDATION_REGEX) !== null
            );
        },
        lookupLabel() {
            if (this.currentState === this.states.Loading) {
                return 'Looking up address…';
            } else {
                return 'Find address';
            }
        },
        id() {
            return Math.random()
                .toString(36)
                .substr(2, 9);
        },
        ariaId() {
            return `postcode-lookup-${this.id}`;
        }
    }
};
</script>

<template>
    <div v-if="currentState !== states.NotRequired">

        <legend class="ff-label ff-address__legend"
                v-html="label">
        </legend>

        <div class="ff-help s-prose" v-if="explanation" v-html="explanation"></div>

        <!-- @TODO i18n -->
        <div v-if="shouldShowPostcodeLookup" class="address-lookup">
            <label :for="ariaId" class="ff-label"
                >Find address by postcode</label
            >
            <div class="ff-help s-prose"><p>eg. EC4A 1DE</p></div>
            <div class="address-lookup__field">
                <input
                    type="text"
                    :id="ariaId"
                    @keydown.enter.prevent="handleLookup"
                    name="postcode-lookup"
                    size="20"
                    class="ff-text"
                    v-model="postcode"
                    autocomplete="off"
                    :required="fieldsAreRequired"
                />
                <button
                    type="button"
                    class="btn btn--small"
                    @click="handleLookup"
                    :disabled="currentState === states.Loading || !formIsValid"
                    aria-live="assertive"
                    aria-atomic="true"
                >
                    {{ lookupLabel }}
                </button>
            </div>

            <div
                class="address-lookup__candidates"
                v-if="candidates.length > 0"
            >
                <label for="address-selection" class="ff-label">
                    Select an address
                </label>
                <select
                    v-model="selectedAddressId"
                    name="address-selection"
                    id="address-selection"
                    :disabled="currentState === states.Loading"
                    :required="fieldsAreRequired"
                >
                    <option disabled value="">
                        {{ candidates.length }} addresses found
                    </option>
                    <option
                        v-for="option in candidates"
                        :value="option.value"
                        :key="option.value"
                    >
                        {{ option.label }}
                    </option>
                </select>
            </div>
        </div>

        <p class="ff-error" v-if="currentState === states.Failure">
            There was an error finding your address - please provide it below.
        </p>

        <div
            v-if="currentState === states.AlreadyAnswered"
            class="existing-data"
        >
            <h3 class="existing-data__title">Selected address</h3>
            <address
                class="existing-data__address"
                v-html="fullAddressPreview"
            ></address>
            <div class="existing-data__actions">
                <button type="button" class="btn-link" @click="startEditing">
                    Edit
                </button>
                <button
                    type="button"
                    class="btn-link u-margin-left-s"
                    @click="removeAddress"
                >
                    Remove
                </button>
            </div>
        </div>

        <!-- fallback fields -->
        <details class="o-details u-margin-top"
                 :open="showFallbackFields"
                 v-if="currentState !== states.NotRequired">
            <summary class="js-only o-details__summary"
                     @click="showFallbackFields = !showFallbackFields">
                Enter address manually
            </summary>

            <div class="existing-data">
                <AddressLine
                    :name="fieldName + '[line1]'"
                    label="Building and street"
                    :is-required="true"
                    v-model="fullAddress.line1">
                </AddressLine>

                <AddressLine
                    :name="fieldName + '[line2]'"
                    label="Address line 2"
                    is-required="false"
                    v-model="fullAddress.line2">
                </AddressLine>

                <AddressLine
                    :name="fieldName + '[townCity]'"
                    label="Town or city"
                    :is-required="true"
                    v-model="fullAddress.townCity"
                    size="30">
                </AddressLine>

                <AddressLine
                    :name="fieldName + '[county]'"
                    label="County"
                    is-required="false"
                    v-model="fullAddress.county"
                    size="30">
                </AddressLine>

                <AddressLine
                    :name="fieldName + '[postcode]'"
                    label="Postcode"
                    :is-required="true"
                    v-model="fullAddress.postcode"
                    size="10">
                </AddressLine>

                <button type="button" class="btn-link u-margin-top-s" @click="finishEditing">
                    I'm done editing
                </button>
            </div>
        </details>

    </div>
</template>
