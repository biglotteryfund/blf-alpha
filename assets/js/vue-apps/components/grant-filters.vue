<script>
import FacetGroup from './facet-group.vue';
import FacetChoice from './facet-choice.vue';
import FacetSelect from './facet-select.vue';

import partition from 'lodash/partition';

export default {
    components: { FacetGroup, FacetChoice, FacetSelect },
    props: ['facets', 'filters', 'isCalculating'],
    computed: {
        programmes() {
            const [featured, other] = partition(this.facets.grantProgramme, programme => {
                return ['awards for all'].some(allowed => programme.value.toLowerCase().indexOf(allowed) !== -1);
            });

            return { featured, other };
        }
    }
};
</script>

<template>
    <fieldset class="search-filters" :class="{ 'search-filters--locked': isCalculating }">
        <div class="search-filters__header">
            <legend class="search-filters__title">Filter by</legend>
            <button type="button" class="search-filters__clear-all btn-link"
                @click="$emit('clear-filters')">
                Clear all filters
            </button>
        </div>

        <FacetGroup
            :value="filters.amount"
            clearLabel="Clear amount"
            @clear-choice="$emit('clear-filters', 'amount')"
        >
            <FacetChoice
                v-model="filters.amount"
                type="radio"
                name="amount"
                label="Amount awarded"
                :options="facets.amountAwarded"
                :optionLimit="3"
            />
        </FacetGroup>

        <FacetGroup
            :value="filters.country"
            clearLabel="Clear country"
            @clear-choice="$emit('clear-filters', 'country')"
        >
            <FacetChoice
                v-model="filters.country"
                type="radio"
                name="country"
                label="Countries"
                :options="facets.countries"
            />
       </FacetGroup>

        <FacetGroup
            :value="filters.programme"
            clearLabel="Clear funding programme"
            @clear-choice="$emit('clear-filters', 'programme')"
        >
           <FacetChoice
                v-model="filters.programme"
                type="radio"
                name="programme"
                label="Funding programme"
                :options="programmes.featured"
            />
            <FacetSelect
                v-model="filters.programme"
                name="programme"
                labelAny="Select a programme"
                label="Other programmes"
                :options="programmes.other"
            />
       </FacetGroup>

        <FacetGroup
            :value="filters.localAuthority"
            clearLabel="Clear local authority"
            @clear-choice="$emit('clear-filters', 'localAuthority')"
        >
            <FacetSelect
                v-model="filters.localAuthority"
                name="localAuthority"
                label="Local authority"
                labelAny="Select a local authority"
                :options="facets.localAuthorities"
            />
       </FacetGroup>

        <FacetGroup
            :value="filters.westminsterConstituency"
            clearLabel="Clear constituency"
            @clear-choice="$emit('clear-filters', 'westminsterConstituency')"
        >
            <FacetSelect
                v-model="filters.westminsterConstituency"
                name="westminsterConstituency"
                label="Westminster constituency"
                labelAny="Select a constituency"
                :options="facets.westminsterConstituencies"
            />
       </FacetGroup>
    </fieldset>
</template>
