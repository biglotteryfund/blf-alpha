import $ from 'jquery';
import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import find from 'lodash/find';
import get from 'lodash/get';
import map from 'lodash/map';
import pickBy from 'lodash/pickBy';
import queryString from 'query-string';
import { trackEvent } from '../helpers/metrics';

import GrantsFilters from './components/grants-filters.vue';
import GrantsSort from './components/grants-sort.vue';
import GrantsTotalSummary from './components/grants-total-summary.vue';
import GrantsFilterSummary from './components/grants-filter-summary.vue';
import GrantsLoadingStatus from './components/grants-loading-status.vue';
import GrantsNoResults from './components/grants-no-results.vue';

const states = {
    NotAsked: 'NotAsked',
    Loading: 'Loading',
    Failure: 'Failure',
    Success: 'Success'
};

function init() {
    const mountEl = document.getElementById('js-past-grants');
    if (!mountEl) {
        return;
    }

    new Vue({
        el: mountEl,
        components: {
            'grants-sort': GrantsSort,
            'grants-filters': GrantsFilters,
            'grants-total-summary': GrantsTotalSummary,
            'grants-filter-summary': GrantsFilterSummary,
            'grants-loading-status': GrantsLoadingStatus,
            'grants-no-results': GrantsNoResults
        },
        data() {
            /**
             * Populate data from global object
             * eg. to share server/client state
             */
            // @ts-ignore
            const initialData = window._PAST_GRANTS_SEARCH;
            const initialQueryParams = get(initialData, 'queryParams', {}) || {};
            const facets = get(initialData, 'facets', {});

            // Reconstruct the summary by grabbing labels from facets
            // (eg. for the subset of filters which have different labels
            // to their URL-provided values
            const initialFilterSummary = map(initialQueryParams, (value, key) => {
                let label;
                switch (key) {
                    case 'amount':
                        label = get(facets, 'amountAwarded[0].label');
                        break;
                    case 'awardDate':
                        label = get(facets, 'awardDate[0].label');
                        break;
                    case 'localAuthority':
                        label = get(facets, 'localAuthorities[0].label');
                        break;
                    case 'westminsterConstituency':
                        label = get(facets, 'westminsterConstituencies[0].label');
                        break;
                }

                return {
                    name: key,
                    label: label || value
                };
            });

            return {
                status: { state: states.NotAsked },
                activeQuery: initialQueryParams.q || null,
                facets: facets,
                sort: get(initialData, 'sort', {}),
                filters: initialQueryParams,
                filterSummary: initialFilterSummary,
                totalResults: initialData.totalResults || 0,
                totalAwarded: initialData.totalAwarded || 0,
                copy: initialData.lang
            };
        },
        watch: {
            filters: {
                handler() {
                    this.filterResults();
                },
                deep: true
            }
        },
        mounted() {
            // Enable inputs (they're disabled by default to avoid double inputs for non-JS users)
            $(this.$el)
                .find('[disabled]')
                .removeAttr('disabled');

            window.onpopstate = event => {
                const historyUrlPath = get(event, 'state.urlPath', window.location.pathname);
                historyUrlPath && this.updateResults(historyUrlPath);
                this.filters = queryString.parse(location.search);
                // Reset the search query if it has just been removed
                if (!this.filters.q) {
                    this.activeQuery = null;
                }
                this.filterSummary = [];
                this.trackUi('Navigation', 'Back');
            };
        },
        methods: {
            trackFilter(filterName, filterValue = null) {
                trackEvent('Past Grants Filter', filterName, filterValue);
            },

            trackUi(category, label = null) {
                trackEvent('Past Grants Interface', category, label);
            },

            handleActiveFilter(payload) {
                let match = find(this.filterSummary, item => item.name === payload.name);
                if (!match) {
                    // Add the new summary item
                    this.filterSummary = [].concat(this.filterSummary, [payload]);
                } else {
                    // Update the existing one
                    this.filterSummary.find(i => i.name === payload.name).label = payload.label;
                }
                this.trackFilter(payload.name, payload.label);
            },

            // Resets filters *and* query search
            clearAll() {
                this.filters = {};
                this.filterSummary = [];
                this.activeQuery = null;
                this.filterResults();
                this.trackUi('Clear all filters and queries');
            },

            clearFilters(name) {
                this.status = { state: states.Loading };
                if (name) {
                    this.filters = pickBy(this.filters, (value, key) => key !== name);
                    this.filterSummary = this.filterSummary.filter(i => i.name !== name);
                    this.trackUi('Clear filter', name);
                } else {
                    this.sort.activeSort = null;
                    this.filters = {};
                    this.filters.q = this.activeQuery; // reset query
                    // remove everything except the query from the summary
                    this.filterSummary = this.filterSummary.filter(i => i.name === 'q');
                    this.trackUi('Clear all filters');
                }
                this.filterResults();
            },

            updateQuery() {
                const filterName = 'q';
                // Prevent a blank string from appearing in the filter summary
                this.filters.q = this.activeQuery || undefined;
                if (this.filters.q) {
                    this.handleActiveFilter({ label: this.activeQuery, name: filterName });
                } else {
                    // Delete the query summary item
                    this.filterSummary = this.filterSummary.filter(i => i.name !== 'q');
                }
                this.filterResults();
                this.trackFilter(filterName, this.activeQuery);
            },

            filterResults() {
                const combinedFilters = cloneDeep(this.filters);

                if (this.sort.activeSort && this.sort.activeSort !== this.sort.defaultSort) {
                    combinedFilters.sort = this.sort.activeSort;
                }

                const newQueryString = queryString.stringify(combinedFilters);

                const urlPath = newQueryString
                    ? `${window.location.pathname}?${newQueryString}`
                    : window.location.pathname;

                this.updateResults(urlPath, newQueryString);
            },

            handleChangeSort(newSort) {
                this.sort.activeSort = newSort;
                this.filterResults();
                this.trackUi('Sort results', newSort);
            },

            updateResults(urlPath, queryString = null) {
                this.status = { state: states.Loading };

                if (window.history.pushState) {
                    window.history.pushState({ urlPath: urlPath }, '', urlPath);
                }

                $.ajax({
                    url: urlPath,
                    dataType: 'json',
                    timeout: 20000
                })
                    .then(response => {
                        // @TODO vue-ize this
                        $('#js-grant-results').html(response.resultsHtml);

                        this.totalResults = response.meta.totalResults;
                        this.totalAwarded = response.meta.totalAwarded;
                        this.facets = response.facets;
                        this.sort = response.meta.sort;
                        this.status = { state: states.Success, data: response };

                        if (this.totalResults === 0) {
                            this.trackUi('No results', queryString);
                        }
                    })
                    .catch(err => {
                        // @ts-ignore
                        const errMsg = err.responseJSON.error;
                        this.status = { state: states.Failure, error: errMsg };
                        this.trackUi('Search error', errMsg);
                    });
            }
        }
    });
}

export default {
    init
};
