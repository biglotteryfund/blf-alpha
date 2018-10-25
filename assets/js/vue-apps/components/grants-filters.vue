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

        <FacetGroup
            :legend="copy.filters.grantLegend"
            :toggle-label="copy.filters.toggle"
        >
            <FacetChoice
                v-model="filters.amount"
                type="radio"
                name="amount"
                class="facet-group__item"
                :copy="copy"
                :label="copy.filters.options.amountAwarded.label"
                :options="facets.amountAwarded"
                :option-limit="3"
                @clear-selection="$emit('clear-filters', 'amount')"
            />
            <FacetChoice
                v-model="filters.awardDate"
                type="radio"
                name="awardDate"
                class="facet-group__item"
                :copy="copy"
                :label="copy.filters.options.awardDate.label"
                :options="facets.awardDate"
                :option-limit="5"
                @clear-selection="$emit('clear-filters', 'awardDate')"
            />

            <FacetSelect
                v-model="filters.programme"
                name="programme"
                :label="copy.filters.options.programme.label"
                :label-any="copy.filters.options.programme.any"
                :clear-label="copy.filters.clearSelection"
                :options="facets.grantProgramme"
                @clear-selection="$emit('clear-filters', 'programme')"
            />
        </FacetGroup>

        <FacetGroup
            :legend="copy.filters.organisationLegend"
            :toggle-label="copy.filters.toggle"
        >
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
                :label-closed="copy.filters.options.country.labelClosed"
                :label-open="copy.filters.options.country.labelOpen"
                class="facet-group__item"
            >
                <FacetSelect
                    v-model="filters.localAuthority"
                    name="localAuthority"
                    class="facet-group__item"
                    :label="copy.filters.options.localAuthority.label"
                    :label-any="copy.filters.options.localAuthority.any"
                    :clear-label="copy.filters.clearSelection"
                    :options="facets.localAuthorities"
                    @clear-selection="$emit('clear-filters', 'localAuthority')"
                />

                <FacetSelect
                    v-model="filters.westminsterConstituency"
                    name="westminsterConstituency"
                    class="facet-group__item"
                    :label="copy.filters.options.westminsterConstituency.label"
                    :label-any="copy.filters.options.westminsterConstituency.any"
                    :clear-label="copy.filters.clearSelection"
                    :options="facets.westminsterConstituencies"
                    @clear-selection="$emit('clear-filters', 'westminsterConstituency')"
                />
            </FacetDisclose>

            <FacetSelect
                v-model="filters.orgType"
                name="orgType"
                :label="copy.filters.options.organisationType.label"
                :label-any="copy.filters.options.organisationType.any"
                :clear-label="copy.filters.clearSelection"
                :options="facets.orgType"
                @clear-selection="$emit('clear-filters', 'orgType')"
            />
        </FacetGroup>

        <div class="search-filters__extra">
            <strong>{{ copy.feedback.title }}</strong><br />
            <div v-html="copy.feedback.body"></div>
        </div>
    </fieldset>
</template>
