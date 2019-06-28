<script>
import $ from 'jquery';
import compact from 'lodash/compact';

import AddressLine from './address-line.vue';

/* @TODO UX/UI snags/edge-cases
 *
 * - Find a way to return to the postcode lookup UI after editing a looked-up address
 * - Make the postcode field required when visible after enabling a nested address field
 *
 * */

const states = {
    NotAsked: 'NotAsked',
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
        conditionalOptions: { type: String, default: null },
        conditionalName: { type: String, default: null },
        isNested: { type: String, default: null },
        fieldName: { type: String, default: null }
    },
    data() {
        return {
            selectedToggle: null,
            showFallbackFields: false,
            currentAddress: null,
            toggleInputOptions: null,
            postcode: null,
            currentState: states.NotAsked,
            states: states,
            fullAddress: null,
            addressData: [],
            candidates: [],
            selectedAddressId: '',
            fallbackVisible: null,
            componentIsNested: false
        };
    },
    mounted() {
        if (this.isNested === 'true') {
            this.componentIsNested = true;
        }
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

        if (this.conditionalOptions) {
            try {
                const conditionalOptions = JSON.parse(this.conditionalOptions);
                if (conditionalOptions) {
                    this.toggleInputOptions = conditionalOptions;
                }
            } catch (e) {} // eslint-disable-line no-empty
        }

        const $form = $(this.$el).parents('form').find('input[type="submit"]');
        const that = this;
        $form.on('click', function(e) {
            if (!that.componentIsNested && that.candidates.length === 0 && !that.showFallbackFields && that.postcode) {
                // @TODO i18n
                alert(`Please click "Find address" and choose an address from the list.`);
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
            // this.$emit('clear-address');
            this.showFallbackFields = false;
        },
        handleFallback() {
            this.clearState();
            this.showFallbackFields = true;
        },
        startEditing() {
            this.currentState = this.states.Editing;
            this.showFallbackFields = true;
            // this.handleFallback();
        },
        updateAddressPreview(fullAddress) {
            if (fullAddress) {
                // this.$emit('full-address', fullAddress);
                this.showFallbackFields = false;
                this.currentState = this.states.AlreadyAnswered;
                this.fullAddress = fullAddress;
            }
        },
        // trackFallbackState(fallbackVisibleState) {
        //     this.fallbackVisible = fallbackVisibleState;
        // }
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
        }
    },
    computed: {

        fieldsAreRequired() {
            if (this.toggleInputOptions) {
                return (
                    this.selectedToggle === 'no'
                );
            } else {
                return (
                    !this.showFallbackFields &&
                    this.shouldShowPostcodeLookup &&
                    !this.componentIsNested
                );
            }
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
        addressHtml() {
            return this.fullAddress
                ? compact([
                      this.fullAddress.line1,
                      this.fullAddress.line2,
                      this.fullAddress.townCity,
                      this.fullAddress.postcode
                  ]).join('<br />')
                : '';
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
    <div>

        <span v-if="fieldsAreRequired">FIELDS REQUIRED</span>
        <span v-if="!fieldsAreRequired">FIELDS NOT REQUIRED</span>

        <!-- @TODO i18n -->
        <div v-if="shouldShowPostcodeLookup" class="address-lookup">

            <fieldset class="ff-choice ff-choice--inline"
                      v-if="toggleInputOptions">
                <ul class="ff-choice__list">
                    <li class="ff-choice__option"
                        v-for="option in toggleInputOptions"
                        :key="option.value">
                        <div class="ff-choice__input">
                            <input type="radio"
                                :name="conditionalName"
                                id="optionId"
                                :value="option.value"
                                @click="selectedToggle = option.value"
                            />
                        </div>
                        <label class="ff-choice__label" for="optionId">
                            {{ option.label }}
                        </label>
                    </li>
                </ul>
            </fieldset>

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
                v-html="addressHtml"
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
                 :open="showFallbackFields">
            <summary class="js-only o-details__summary"
                     @click="showFallbackFields = !showFallbackFields">
                Enter address manually
            </summary>

            <AddressLine
                :name="fieldName + '[line1]'"
                label="Building and street"
                :is-required="fieldsAreRequired"
                :value="fullAddress ? fullAddress.line1 : null">
            </AddressLine>

            <AddressLine
                :name="fieldName + '[line2]'"
                label="Address line 2"
                is-required="false"
                :value="fullAddress ? fullAddress.line2 : null">
            </AddressLine>

            <AddressLine
                :name="fieldName + '[townCity]'"
                label="Town or city"
                :is-required="fieldsAreRequired"
                :value="fullAddress ? fullAddress.townCity : null"
                size="30">
            </AddressLine>

            <AddressLine
                :name="fieldName + '[county]'"
                label="County"
                is-required="false"
                :value="fullAddress ? fullAddress.county : null"
                size="30">
            </AddressLine>

            <AddressLine
                :name="fieldName + '[postcode]'"
                label="Postcode"
                :is-required="fieldsAreRequired"
                :value="fullAddress ? fullAddress.postcode : null"
                size="10">
            </AddressLine>

        </details>


    </div>
</template>
