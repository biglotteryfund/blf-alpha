<script>
    import $ from 'jquery';
    import compact from 'lodash/compact';

    import AddressLine from './address-line.vue';
    import { trackEvent, tagHotjarRecording } from '../../helpers/metrics';

    const states = {
        NotAsked: 'NotAsked',
        NotRequired: 'NotRequired',
        AlreadyAnswered: 'AlreadyAnswered',
        Editing: 'Editing',
        Asking: 'Asking',
        Loading: 'Loading',
        Failure: 'Failure',
        Success: 'Success',
        EnteringManually: 'EnteringManually'
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
                addressData: [],
                candidates: [],
                selectedAddressId: ''
            };
        },
        mounted() {
            this.$root.$on('update:conditionalRadio', value => {
                if (value === 'no') {
                    tagHotjarRecording(['Apply: AFA: Contacts: User needs address history']);
                }
                if (value === 'yes') {
                    this.currentState = states.NotRequired;
                } else if (this.fullAddress.postcode !== null) {
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
                        this.currentState = this.states.AlreadyAnswered;
                        this.fullAddress = fullAddress;
                    }
                } catch (e) {} // eslint-disable-line no-empty
            }

            const $form = $(this.$el)
                .parents('form')
                .find('input[type="submit"]');
            const that = this;
            $form.on('click', function() {
                if (
                    that.candidates.length === 0 &&
                    that.postcode
                ) {
                    // @TODO i18n
                    alert(
                        `Please click "Find address" and choose an address from the list.`
                    );
                    trackEvent(
                        'Form warning',
                        'Postcode lookup',
                        'Typed but not submitted'
                    );
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
                return {
                    line1: address.line_1,
                    line2: address.line_2,
                    townCity: address.post_town,
                    county: address.county,
                    postcode: address.postcode
                };
            },
            handleFailure() {
                // Handle case of no results for search
                this.currentState = this.states.Failure;
                trackEvent(
                    'Form warning',
                    'Postcode lookup',
                    'Error looking up address'
                );
                tagHotjarRecording(['Apply: AFA: Org Details: Unable to find address']);
                this.clearState();
            },
            handleLookup() {
                if (!this.formIsValid) {
                    return;
                }
                this.currentState = this.states.Loading;

                this.clearAddress();
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
                this.clearAddress();
            },
            clearAddress() {
                this.fullAddress = {
                    line1: null,
                    line2: null,
                    townCity: null,
                    county: null,
                    postcode: null
                };
            },
            removeAddress() {
                trackEvent(
                    'Form warning',
                    'Postcode lookup',
                    'Address removed'
                );
                this.currentState = this.states.Asking;
                this.clearState();
            },
            setSelectedAddress() {
                if (this.selectedAddressId) {
                    const address = this.getAddressFromId(this.selectedAddressId);
                    if (address) {
                        this.currentState = this.states.AlreadyAnswered;
                        this.fullAddress = this.formatAddress(address);
                    }
                }
            },
            enterManually() {
                trackEvent(
                    'Form warning',
                    'Postcode lookup',
                    'Enter Manually clicked'
                );
                this.currentState = this.states.EnteringManually;
            }
        },
        computed: {
            shouldShowPostcodeLookup() {
                return (
                    this.currentState === this.states.Asking ||
                    this.currentState === this.states.NotAsked ||
                    this.currentState === this.states.Success ||
                    this.currentState === this.states.Loading
                );
            },
            shouldShowInputFields() {
                return (
                    this.currentState === states.AlreadyAnswered ||
                    this.currentState === states.Failure ||
                    this.currentState === states.EnteringManually
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
        <legend class="ff-label ff-address__legend" v-html="label"></legend>

        <div
            class="ff-help s-prose"
            v-if="explanation"
            v-html="explanation"
        ></div>

        <!-- @TODO i18n -->
        <div v-if="shouldShowPostcodeLookup" class="address-lookup">
            <label :for="ariaId" class="ff-label">Find address by postcode</label>
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
                    :required="shouldShowPostcodeLookup"
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

            <button
                type="button"
                class="btn-link u-margin-top-s"
                @click="enterManually"
            >
                Enter address manually
            </button>

            <div
                class="address-lookup__candidates"
                v-if="candidates.length > 0"
            >
                <label for="address-selection" class="ff-label">
                    Select an address
                </label>
                <!-- We use @blur here to avoid Win/Chrome bug where keypresses trigger a change on the first item-->
                <select
                    v-model="selectedAddressId"
                    name="address-selection"
                    id="address-selection"
                    :disabled="currentState === states.Loading"
                    :required="shouldShowPostcodeLookup"
                    @blur="setSelectedAddress"
                    data-hj-suppress
                >
                    <option disabled value="">
                        {{ candidates.length }} addresses found
                    </option>
                    <option
                        v-for="option in candidates"
                        :value="option.value"
                        :key="option.value"
                        data-hj-suppress
                    >
                        {{ option.label }}
                    </option>
                </select>
            </div>
        </div>

        <p class="ff-error" v-if="currentState === states.Failure">
            There was an error finding your address - please provide it below.
        </p>

        <div class="existing-data" v-if="shouldShowInputFields">
            <AddressLine
                :name="fieldName + '[line1]'"
                label="Building and street"
                :is-required="true"
                v-model="fullAddress.line1"
            >
            </AddressLine>

            <AddressLine
                :name="fieldName + '[line2]'"
                label="Address line 2"
                is-required="false"
                v-model="fullAddress.line2"
            >
            </AddressLine>

            <AddressLine
                :name="fieldName + '[townCity]'"
                label="Town or city"
                :is-required="true"
                v-model="fullAddress.townCity"
                size="30"
            >
            </AddressLine>

            <AddressLine
                :name="fieldName + '[county]'"
                label="County"
                is-required="false"
                v-model="fullAddress.county"
                size="30"
            >
            </AddressLine>

            <AddressLine
                :name="fieldName + '[postcode]'"
                label="Postcode"
                :is-required="true"
                v-model="fullAddress.postcode"
                size="10"
            >
            </AddressLine>

            <button
                type="button"
                class="btn-link u-margin-top-s"
                @click="removeAddress"
            >
                Remove this address
            </button>
        </div>
    </div>
</template>
