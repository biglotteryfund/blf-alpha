<script>
import $ from 'jquery';
import compact from 'lodash/compact';

const states = {
    NotAsked: 'NotAsked',
    Loading: 'Loading',
    Failure: 'Failure',
    Success: 'Success'
};

export default {
    props: {
        locale: { type: String, default: 'en' }
    },
    data() {
        return {
            states: states,
            currentState: states.NotAsked,
            postcode: null,
            candidates: [],
            selectedAddressId: '',
            showAddressPreview: false,
            fullAddress: null
        };
    },
    methods: {
        formatAddress(result) {
            return {
                addressLine1: [
                    result.Flat_No,
                    result.Building_No,
                    result.Building_Name,
                    result.Street_Name
                ].join(' '),
                townCity: result.Town_City,
                county: result.County,
                postcode: result.PostCode
            };
        },
        handleLookup() {
            this.currentState = this.states.Loading;
            this.fullAddress = null;
            $.ajax({
                url: '/api/address-lookup',
                dataType: 'json',
                data: { q: this.postcode }
            }).then(response => {
                this.currentState = this.states.Success;
                this.candidates = response.data.map(result => {
                    return { value: result.Moniker, label: result.Text };
                });
            });
        },
        handleFallback() {
            this.showAddressPreview = false;
            this.$emit('show-fallback');
        }
    },
    watch: {
        selectedAddressId() {
            if (this.selectedAddressId) {
                $.ajax({
                    url: `/api/address-lookup/${this.selectedAddressId}`,
                    dataType: 'json',
                    data: { q: this.postcode }
                }).then(response => {
                    this.currentState = this.states.Success;
                    const fullAddress = this.formatAddress(response.data);
                    this.$emit('full-address', fullAddress);
                    this.showAddressPreview = true;
                    this.fullAddress = fullAddress;
                });
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
            return compact([
                this.fullAddress.addressLine1,
                this.fullAddress.townCity,
                this.fullAddress.postcode
            ]).join('<br />');
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
        <div class="address-lookup">
            <label :for="ariaId" class="ff-label"
                >Find address by postcode</label
            >
            <div class="address-lookup__field">
                <input
                    type="text"
                    :id="ariaId"
                    name="postcode-lookup"
                    size="20"
                    class="ff-text"
                    v-model="postcode"
                />
                <button
                    type="button"
                    class="btn btn--small"
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

        <div class="selected-address" v-if="fullAddress && showAddressPreview">
            <h3 class="selected-address__title">Selected address</h3>
            <address
                class="selected-address__address"
                v-html="addressHtml"
            ></address>
            <div class="selected-address__actions">
                <button type="button" class="btn-link" @click="handleFallback">
                    Edit
                </button>
            </div>
        </div>
    </div>
</template>
