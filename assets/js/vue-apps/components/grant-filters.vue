<script>
import IconClose from './icon-close.vue';
import FacetChoice from './facet-choice.vue';
import FacetSelect from './facet-select.vue';

export default {
    components: { IconClose, FacetChoice, FacetSelect },
    props: [ 'facets', 'filters', 'isCalculating' ]
};
</script>

<template>
    <div class="search-filters" :class="{ 'search-filters--locked': isCalculating }">
        <div class="search-filters__header">
            <span class="search-filters__title">Filter by</span>

            <button type="button" class="search-filters__clear-all btn-link"
                @click="$emit('clear-filters')">
                Clear all filters
            </button>
        </div>

        <div class="search-filters__facet">
            <FacetChoice
                v-model="filters.amount"
                type="radio"
                name="amount"
                label="Amount awarded"
                labelAny="Any amount"
                :options="facets.amountAwarded"
                @clear-choice="$emit('clear-filters', 'amount')"
            />
        </div>

        <div class="search-filters__facet">
            <FacetChoice
                v-model="filters.country"
                type="radio"
                name="country"
                label="Countries"
                labelAny="All countries"
                :options="facets.countries"
                @clear-choice="$emit('clear-filters', 'country')"
            />
        </div>

        <div class="search-filters__facet">
            <FacetSelect
                v-model="filters.localAuthority"
                name="localAuthority"
                label="Local authority"
                labelAny="All local authorities"
                :options="facets.localAuthorities"
                @clear-choice="$emit('clear-filters', 'localAuthority')"
            />
        </div>

        <div class="search-filters__facet">
            <FacetSelect
                v-model="filters.westminsterConstituency"
                name="westminsterConstituency"
                label="Westminster constituency"
                labelAny="All constituencies"
                :options="facets.westminsterConstituencies"
                @clear-choice="$emit('clear-filters', 'westminsterConstituency')"
            />
        </div>
    </div>
</template>
