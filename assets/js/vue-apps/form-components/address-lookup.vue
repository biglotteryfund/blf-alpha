<script>
import $ from 'jquery';

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
                address1: [result.Flat_No, result.Building_No, result.Building_Name, result.Street_Name].join(' '),
                townCity: result.Town_City,
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
    }
};
</script>

<template>
    <div>
        <div class="postcode-lookup">
            <label for="postcode-lookup" class="ff-label">Find address by postcode</label>
            <div class="postcode-lookup__field">
                <input
                    type="text"
                    id="postcode-lookup"
                    name="postcode-lookup"
                    size="10"
                    class="ff-text"
                    v-model="postcode"
                />
                <button
                    type="button"
                    class="btn btn--small"
                    @click="handleLookup"
                    :disabled="currentState === states.Loading"
                >
                    Find address
                </button>
            </div>
        </div>

        <div role="alert" aria-live="assertive">
            <template v-if="currentState === states.Loading"
                ><p>Looking up addressess…</p></template
            >
        </div>

        <template v-if="candidates.length > 0">
            <div class="u-margin-bottom">
                <label for="address-selection" class="ff-label">Select an address</label>
                <select
                    v-model="selectedAddressId"
                    name="address-selection"
                    id="address-selection"
                    :disabled="currentState === states.Loading"
                    style="max-width: 25em;"
                >
                    <option disabled value="">{{ candidates.length }} addresses found</option>
                    <option v-for="option in candidates" :value="option.value" :key="option.value">
                        {{ option.label }}
                    </option>
                </select>
            </div>
        </template>

        <template v-if="fullAddress && showAddressPreview">
            <div class="card">
                <header class="card__header">
                    <h2 class="card__title t4">Selected address</h2>
                </header>
                <address class="card__body">
                    {{ fullAddress.address1 }}<br />
                    <template v-if="fullAddress.address2"
                        >{{ fullAddress.address2 }}<br
                    /></template>
                    {{ fullAddress.townCity }}<br />
                    {{ fullAddress.postcode }}
                </address>
                <footer class="card__footer">
                    <p><button type="button" class="btn-link" @click="handleFallback">Edit</button></p>
                </footer>
            </div>
        </template>
    </div>
</template>
