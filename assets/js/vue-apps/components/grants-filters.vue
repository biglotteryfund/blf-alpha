<script>
import FacetGroup from './facet-group.vue';
import FacetDisclose from './facet-disclose.vue';
import FacetRadios from './facet-radios.vue';
import FacetSelect from './facet-select.vue';
import has from 'lodash/has';
import $ from 'jquery';

export default {
    components: { FacetGroup, FacetDisclose, FacetRadios, FacetSelect },
    props: [
        'facets',
        'filters',
        'status',
        'copy',
        'handleActiveFilter',
        'trackUi',
    ],
    data() {
        return { grantKey: 0,  orgKey: 1};
    },
    created() {
        window.addEventListener("resize", this.forceRerender);
    },
    destroyed() {
        window.removeEventListener("resize", this.forceRerender);
    },
    methods: {
        isActiveFacet(name) {
            return has(this.filters, name);
        },
        triggerFeedbackPanel(event) {
            // Prevent this from updating the window history, which triggers a search
            event.preventDefault();
            $('#feedback summary').click().get(0).scrollIntoView();
        },
        openByDefault(){
            return window.innerWidth > 640;
        },
        forceRerender(){
            this.grantKey += 1;
            this.orgKey += 1;
        },
    },
};
</script>

<template>
    <fieldset
        class="search-filters"
        :class="{ 'search-filters--locked': status.state === 'Loading' }"
    >
        <div class="search-filters__header">
            <legend class="search-filters__title">
                {{ copy.filters.title }}
            </legend>
            <button
                tabindex="0"
                role="link"
                class="search-filters__clear-all btn-link"
                @click="$emit('clear-filters')"
            >
                {{ copy.filters.reset }}
            </button>
        </div>

        <FacetGroup
            :key="this.grantKey"
            :open-by-default="openByDefault()"
            :legend="copy.filters.grantLegend"
            :toggle-label="copy.filters.toggle"
            :track-ui="trackUi"
        >
            <FacetRadios
                v-model="filters.amount"
                type="radio"
                name="amount"
                class="facet-group__item"
                :copy="copy"
                :label="copy.filters.options.amountAwarded.label"
                :options="facets.amountAwarded"
                :option-limit="3"
                @clear-selection="$emit('clear-filters', 'amount')"
                :handle-active-filter="handleActiveFilter"
                :track-ui="trackUi"
            />
            <FacetRadios
                v-model="filters.awardDate"
                type="radio"
                name="awardDate"
                class="facet-group__item"
                :copy="copy"
                :label="copy.filters.options.awardDate.label"
                :options="facets.awardDate"
                :option-limit="3"
                @clear-selection="$emit('clear-filters', 'awardDate')"
                :handle-active-filter="handleActiveFilter"
                :track-ui="trackUi"
            />

            <FacetSelect
                v-model="filters.programme"
                name="programme"
                :label="copy.filters.options.programme.label"
                :label-any="copy.filters.options.programme.any"
                :clear-label="copy.filters.clearSelection"
                :options="facets.grantProgramme"
                @clear-selection="$emit('clear-filters', 'programme')"
                :handle-active-filter="handleActiveFilter"
            />
        </FacetGroup>

        <FacetGroup
            :key="this.orgKey"
            :open-by-default="openByDefault()"
            :legend="copy.filters.organisationLegend"
            :toggle-label="copy.filters.toggle"
            :track-ui="trackUi"
        >
            <FacetRadios
                v-model="filters.country"
                type="radio"
                name="country"
                :label="copy.filters.options.country.label"
                :copy="copy"
                :hide-label="true"
                :options="facets.countries"
                @clear-selection="$emit('clear-filters', 'country')"
                :handle-active-filter="handleActiveFilter"
                :track-ui="trackUi"
            />

            <FacetDisclose
                :label-open="copy.filters.options.country.labelOpen"
                :label-closed="copy.filters.options.country.labelClosed"
                :initial-open="
                    isActiveFacet('localAuthority') ||
                    isActiveFacet('westminsterConstituency')
                "
                :track-ui="trackUi"
                :filter-name="'country'"
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
                    :handle-active-filter="handleActiveFilter"
                />

                <FacetSelect
                    v-model="filters.westminsterConstituency"
                    name="westminsterConstituency"
                    class="facet-group__item"
                    :label="copy.filters.options.westminsterConstituency.label"
                    :label-any="
                        copy.filters.options.westminsterConstituency.any
                    "
                    :clear-label="copy.filters.clearSelection"
                    :options="facets.westminsterConstituencies"
                    @clear-selection="
                        $emit('clear-filters', 'westminsterConstituency')
                    "
                    :handle-active-filter="handleActiveFilter"
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
                :handle-active-filter="handleActiveFilter"
            />
        </FacetGroup>

        <p class="u-margin-top-s u-margin-bottom-s">
            <strong>{{ copy.feedback.title }}</strong>
        </p>
        <p
            v-html="copy.feedback.body"
            @click="triggerFeedbackPanel($event)"
        ></p>
    </fieldset>
</template>
