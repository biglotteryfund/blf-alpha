<script>
    import FacetGroup from './facet-group.vue';
    import FacetDisclose from './facet-disclose.vue';
    import FacetChoice from './facet-choice.vue';
    import FacetSelect from './facet-select.vue';

    export default {
        components: { FacetGroup, FacetDisclose, FacetChoice, FacetSelect },
        props: ['facets', 'filters', 'status', 'copy']
    };
</script>

<template>
    <fieldset class="search-filters"
              :class="{ 'search-filters--locked': status.state === 'Loading' }"
    >
        <div class="search-filters__header">
            <legend class="search-filters__title">{{ copy.filters.title }}</legend>
            <button type="button" class="search-filters__clear-all btn-link"
                    @click="$emit('clear-filters')">
                {{ copy.filters.reset }}
            </button>
        </div>

        <FacetGroup :legend="copy.filters.options.amountAwarded.label"
                    :copy="copy">
            <FacetChoice
                v-model="filters.amount"
                type="radio"
                name="amount"
                :copy="copy"
                :label="copy.filters.options.amountAwarded.label"
                :hideLabel="true"
                :options="facets.amountAwarded"
                :optionLimit="3"
                @clear-selection="$emit('clear-filters', 'amount')"
            />
        </FacetGroup>

        <FacetGroup :legend="copy.filters.options.organisation"
                    :copy="copy">
            <FacetSelect
                v-model="filters.orgType"
                name="orgType"
                :label="copy.filters.options.organisationType.label"
                :labelAny="copy.filters.options.organisationType.any"
                :copy="copy"
                :options="facets.orgType"
                @clear-selection="$emit('clear-filters', 'orgType')"
            />

            <FacetSelect
                v-model="filters.programme"
                name="programme"
                :label="copy.filters.options.programme.label"
                :labelAny="copy.filters.options.programme.any"
                :copy="copy"
                :options="facets.grantProgramme"
                @clear-selection="$emit('clear-filters', 'programme')"
            />
        </FacetGroup>

        <FacetGroup :legend="copy.filters.options.country.label"
                    :copy="copy">
            <FacetChoice
                v-model="filters.country"
                type="radio"
                name="country"
                :label="copy.filters.options.country.label"
                :copy="copy"
                :hide-label="true"
                :options="facets.countries"
                @clear-selection="$emit('clear-filters', 'country')"
            />

            <FacetDisclose
                :labelClosed="copy.filters.options.country.labelClosed"
                :labelOpen="copy.filters.options.country.labelOpen"
            >
                <FacetSelect
                    v-model="filters.localAuthority"
                    name="localAuthority"
                    :label="copy.filters.options.localAuthority.label"
                    :labelAny="copy.filters.options.localAuthority.any"
                    :copy="copy"
                    :options="facets.localAuthorities"
                    @clear-selection="$emit('clear-filters', 'localAuthority')"
                />

                <FacetSelect
                    v-model="filters.westminsterConstituency"
                    name="westminsterConstituency"
                    :label="copy.filters.options.westminsterConstituency.label"
                    :labelAny="copy.filters.options.westminsterConstituency.any"
                    :copy="copy"
                    :options="facets.westminsterConstituencies"
                    @clear-selection="$emit('clear-filters', 'westminsterConstituency')"
                />
            </FacetDisclose>
        </FacetGroup>


        <div class="search-filters__extra">
            <strong>{{ copy.feedback.title }}</strong><br/>
            <div v-html="copy.feedback.body"></div>
        </div>
    </fieldset>
</template>
