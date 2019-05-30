<script>
import $ from 'jquery';
import compact from 'lodash/compact';

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
    props: {
        locale: { type: String, default: 'en' },
        address: { type: String, default: null }
    },
    data() {
        return {
            currentAddress: null,
            postcode: null,
            currentState: states.NotAsked,
            states: states,
            fullAddress: null,
            addressData: [],
            candidates: [],
            selectedAddressId: ''
            // showAddressPreview: false,
        };
    },
    mounted() {
        if (this.address) {
            try {
                const addressParts = JSON.parse(this.address);
                if (addressParts) {
                    this.currentAddress = addressParts;
                    this.fullAddress = {
                        line1: this.currentAddress.line1,
                        line2: this.currentAddress.line2,
                        townCity: this.currentAddress.townCity,
                        county: this.currentAddress.county,
                        postcode: this.currentAddress.postcode
                    };
                    this.currentState = this.states.AlreadyAnswered;
                }
            } catch (e) {} // eslint-disable-line no-empty
        }
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
            this.currentState = this.states.Loading;
            this.fullAddress = null;
            $.ajax({
                url: '/api/address-lookup',
                dataType: 'json',
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
                                result['line_3'],
                                result['district'],
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
        },
        removeAddress() {
            this.currentState = this.states.Asking;
            this.clearState();
            this.$emit('clear-address');
        },
        handleFallback() {
            this.currentState = this.states.Editing;
            this.clearState();
            this.$emit('show-fallback');
        },
        updateAddressPreview(fullAddress) {
            if (fullAddress) {
                this.$emit('full-address', fullAddress);
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
        }
    },
    computed: {
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
        <div
            v-if="
                currentState === states.Asking ||
                    currentState === states.NotAsked ||
                    currentState === states.Success ||
                    currentState === states.Loading
            "
            class="address-lookup"
        >
            <label :for="ariaId" class="ff-label"
                >Find address by postcode</label
            >
            <div class="address-lookup__field">
                <input
                    type="text"
                    :id="ariaId"
                    @keydown.enter.prevent="handleLookup"
                    name="postcode-lookup"
                    size="20"
                    class="ff-text"
                    v-model="postcode"
                />
                <button
                    type="button"
                    class="btn btn--small u-margin-left-s"
                    @click="handleLookup"
                    :disabled="currentState === states.Loading"
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
                <label for="address-selection" class="ff-label"
                    >Select an address</label
                >
                <select
                    v-model="selectedAddressId"
                    name="address-selection"
                    id="address-selection"
                    :disabled="currentState === states.Loading"
                >
                    <option disabled value=""
                        >{{ candidates.length }} addresses found</option
                    >
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
            class="selected-address"
        >
            <h3 class="selected-address__title">Selected address</h3>
            <address
                class="selected-address__address"
                v-html="addressHtml"
            ></address>
            <div class="selected-address__actions">
                <button type="button" class="btn-link" @click="handleFallback">
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
    </div>
</template>
