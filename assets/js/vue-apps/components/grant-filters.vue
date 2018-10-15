<script>
import FacetGroup from './facet-group.vue';
import FacetDisclose from './facet-disclose.vue';
import FacetChoice from './facet-choice.vue';
import FacetSelect from './facet-select.vue';

import partition from 'lodash/partition';

export default {
    components: { FacetGroup, FacetDisclose, FacetChoice, FacetSelect },
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

        <FacetGroup legend="Recipient location">
            <FacetChoice
                v-model="filters.country"
                type="radio"
                name="country"
                label="Countries"
                :hideLabel="true"
                labelAny="Any country"
                :options="facets.countries"
            />

            <FacetDisclose>
                <FacetSelect
                    v-model="filters.localAuthority"
                    name="localAuthority"
                    label="Local authority"
                    labelAny="Select a local authority"
                    :options="facets.localAuthorities"
                />

                <FacetSelect
                    v-model="filters.westminsterConstituency"
                    name="westminsterConstituency"
                    label="Westminster constituency"
                    labelAny="Select a constituency"
                    :options="facets.westminsterConstituencies"
                />
            </FacetDisclose>
       </FacetGroup>

        <FacetGroup legend="Amount awarded">
            <FacetChoice
                v-model="filters.amount"
                type="radio"
                name="amount"
                label="Amount awarded"
                :hideLabel=true
                labelAny="Any amount"
                :options="facets.amountAwarded"
                :optionLimit="3"
            />
        </FacetGroup>

        <FacetGroup legend="Funding programme">
           <FacetChoice
                v-model="filters.programme"
                type="radio"
                name="programme"
                label="Funding programme"
                :hideLabel=true
                :options="programmes.featured"
            />
            <FacetSelect
                v-model="filters.programme"
                name="programme"
                label="Other programmes"
                labelAny="Select a programme"
                :options="programmes.other"
            />
       </FacetGroup>
    </fieldset>
</template>
