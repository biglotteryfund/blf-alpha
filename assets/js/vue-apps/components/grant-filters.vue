<script>
import FacetGroup from './facet-group.vue';
import FacetDisclose from './facet-disclose.vue';
import FacetChoice from './facet-choice.vue';
import FacetSelect from './facet-select.vue';

import partition from 'lodash/partition';

export default {
    components: { FacetGroup, FacetDisclose, FacetChoice, FacetSelect },
    props: ['facets', 'filters', 'status'],
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
    <fieldset class="search-filters"
        :class="{ 'search-filters--locked': status.state === 'Loading' }"
    >
        <div class="search-filters__header">
            <legend class="search-filters__title">Filter by</legend>
            <button type="button" class="search-filters__clear-all btn-link"
                @click="$emit('clear-filters')">
                Reset filters
            </button>
        </div>

        <FacetGroup legend="Recipient location">
            <FacetChoice
                v-model="filters.country"
                type="radio"
                name="country"
                label="Countries"
                :options="facets.countries"
                @clear-selection="$emit('clear-filters', 'country')"
            />

            <FacetDisclose>
                <FacetSelect
                    v-model="filters.localAuthority"
                    name="localAuthority"
                    label="Local authority"
                    labelAny="Select a local authority"
                    :options="facets.localAuthorities"
                    @clear-selection="$emit('clear-filters', 'localAuthority')"
                />

                <FacetSelect
                    v-model="filters.westminsterConstituency"
                    name="westminsterConstituency"
                    label="Westminster constituency"
                    labelAny="Select a constituency"
                    :options="facets.westminsterConstituencies"
                    @clear-selection="$emit('clear-filters', 'westminsterConstituency')"
                />
            </FacetDisclose>
       </FacetGroup>

        <FacetGroup legend="Grant size">
            <FacetChoice
                v-model="filters.amount"
                type="radio"
                name="amount"
                label="Amount awarded"
                :options="facets.amountAwarded"
                :optionLimit="3"
                @clear-selection="$emit('clear-filters', 'amount')"
            />
        </FacetGroup>

        <FacetGroup legend="Funding programme">
           <FacetChoice
                v-model="filters.programme"
                type="radio"
                name="programme"
                label="Featured programmes"
                :options="programmes.featured"
                @clear-selection="$emit('clear-filters', 'programme')"
            />
            <FacetSelect
                v-model="filters.programme"
                name="programme"
                label="Other programmes"
                labelAny="Select a programme"
                :options="programmes.other"
                @clear-selection="$emit('clear-filters', 'programme')"
            />
       </FacetGroup>

       <div class="search-filters__extra">
            <strong>Is something missing?</strong><br/>
            Please <a href="#feedback">send us feedback</a> to help us improve this service
       </div>
    </fieldset>
</template>
