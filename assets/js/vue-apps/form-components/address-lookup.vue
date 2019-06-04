<script>
import $ from 'jquery';
import compact from 'lodash/compact';

/* @TODO UX/UI snags/edge-cases
 *
 * - Find a way to return to the postcode lookup UI after editing a looked-up address
 * - Make the postcode field required when visible after enabling a nested address field
 * - Make it clearer a postcode must be *submitted* after being typed, otherwise form submission fails silently
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
    props: {
        locale: { type: String, default: 'en' },
        address: { type: String, default: null },
        isNested: { type: String, default: null }
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
        },
        removeAddress() {
            this.currentState = this.states.Asking;
            this.clearState();
            this.$emit('clear-address');
        },
        handleFallback() {
            this.clearState();
            this.$emit('show-fallback');
        },
        startEditing() {
            this.currentState = this.states.Editing;
            this.handleFallback();
        },
        updateAddressPreview(fullAddress) {
            if (fullAddress) {
                this.$emit('full-address', fullAddress);
                this.currentState = this.states.AlreadyAnswered;
                this.fullAddress = fullAddress;
            }
        },
        trackFallbackState(fallbackVisibleState) {
            this.fallbackVisible = fallbackVisibleState;
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
        elementIsHidden() {
            return this.$el && this.$el.offsetParent === null;
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
        <!-- @TODO i18n -->
        <div v-if="shouldShowPostcodeLookup" class="address-lookup">
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
                    autocomplete="off"
                    :required="
                        !this.fallbackVisible &&
                            shouldShowPostcodeLookup &&
                            !componentIsNested
                    "
                />
                <button
                    type="button"
                    class="btn btn--small u-margin-left-s"
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
                    required
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
            class="selected-address"
        >
            <h3 class="selected-address__title">Selected address</h3>
            <address
                class="selected-address__address"
                v-html="addressHtml"
            ></address>
            <div class="selected-address__actions">
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
    </div>
</template>
