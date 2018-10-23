<script>
import FacetGroup from './facet-group.vue';
import FacetDisclose from './facet-disclose.vue';
import FacetChoice from './facet-choice.vue';
import FacetSelect from './facet-select.vue';

export default {
    components: { FacetGroup, FacetDisclose, FacetChoice, FacetSelect },
    props: ['facets', 'filters', 'status']
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

        <FacetGroup legend="Grant amount">
            <FacetChoice
                v-model="filters.amount"
                type="radio"
                name="amount"
                label="Amount awarded"
                :hideLabel="true"
                :options="facets.amountAwarded"
                :optionLimit="3"
                @clear-selection="$emit('clear-filters', 'amount')"
            />
        </FacetGroup>

        <FacetGroup legend="Organisation">
            <FacetSelect
                v-model="filters.orgType"
                name="orgType"
                label="Type of organisation"
                labelAny="Select an organisation type"
                :options="facets.orgType"
                @clear-selection="$emit('clear-filters', 'orgType')"
            />

            <FacetSelect
                v-model="filters.programme"
                name="programme"
                label="Funding programme"
                labelAny="Select a programme"
                :options="facets.grantProgramme"
                @clear-selection="$emit('clear-filters', 'programme')"
            />
        </FacetGroup>

        <FacetGroup legend="Location">
            <FacetChoice
                v-model="filters.country"
                type="radio"
                name="country"
                label="Country"
                :hideLabel="true"
                :options="facets.countries"
                @clear-selection="$emit('clear-filters', 'country')"
            />

            <FacetDisclose
                labelClosed="See advanced location options"
                labelOpen="Hide advanced location options"
            >
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


       <div class="search-filters__extra">
            <strong>Is something missing?</strong><br/>
            Please <a href="#feedback">send us feedback</a> to help us improve this service
       </div>
    </fieldset>
</template>
