import $ from 'jquery';
import Vue from 'vue';
import queryString from 'query-string';
import cloneDeep from 'lodash/cloneDeep';
import find from 'lodash/find';
import get from 'lodash/get';
import map from 'lodash/map';
import assign from 'lodash/assign';
import pickBy from 'lodash/pickBy';
import trim from 'lodash/trim';

import { trackEvent } from '../helpers/metrics';
import { storageAvailable, setWithExpiry } from '../helpers/storage';

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

const canStore = storageAvailable('localStorage');

function init(STORAGE_KEY) {
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

            return {
                currentRequest: null,
                status: { state: states.NotAsked },
                resultsWereFiltered: false,
                resultsHtml: null,
                activeQuery: initialQueryParams.q || null,
                facets: facets,
                sort: get(initialData, 'sort', {}),
                filters: initialQueryParams,
                filterSummary: [],
                totalResults: initialData.totalResults || 0,
                totalAwarded: initialData.totalAwarded || 0,
                searchSuggestions: initialData.searchSuggestions || null,
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

            // Generate summary once we've parsed the facets
            this.filterSummary = this.buildFilterSummary(this.filters);

            window.onpopstate = event => {
                const historyUrlPath = get(event, 'state.urlPath', window.location.pathname);
                historyUrlPath && this.updateResults(historyUrlPath);
                this.filters = queryString.parse(location.search);
                // Reset the search query if it has just been removed
                if (!this.filters.q) {
                    this.activeQuery = null;
                }
                this.filterSummary = this.buildFilterSummary(this.filters);
                this.trackUi('Navigation', 'Back');
            };
        },
        methods: {
            buildFilterSummary(queryParams) {
                // Reconstruct the summary by grabbing labels from facets
                // (eg. for the subset of filters which have different labels
                // to their URL-provided values
                return map(queryParams, (value, key) => {
                    let label;
                    switch (key) {
                        case 'amount':
                            label = get(this.facets, 'amountAwarded[0].label');
                            break;
                        case 'awardDate':
                            label = get(this.facets, 'awardDate[0].label');
                            break;
                        case 'localAuthority':
                            label = get(this.facets, 'localAuthorities[0].label');
                            break;
                        case 'westminsterConstituency':
                            label = get(this.facets, 'westminsterConstituencies[0].label');
                            break;
                    }

                    return {
                        name: key,
                        label: label || value
                    };
                });
            },

            trackFilter(filterName, filterValue = null) {
                trackEvent('Past Grants Filter', filterName, filterValue);
            },

            trackUi(category, label = null) {
                trackEvent('Past Grants Interface', category, label);
            },

            handleActiveFilter(payload) {
                const match = find(this.filterSummary, item => item.name === payload.name);

                if (match) {
                    if (match.label !== payload.label) {
                        this.trackFilter(payload.name, payload.label);
                    }

                    // Update the existing one
                    this.filterSummary.find(i => i.name === payload.name).label = payload.label;
                } else {
                    // Add the new summary item
                    this.filterSummary = [].concat(this.filterSummary, [payload]);
                    this.trackFilter(payload.name, payload.label);
                }
            },

            // Resets filters *and* query search
            clearAll() {
                this.filters = {};
                this.filterSummary = [];
                this.activeQuery = null;
                this.trackUi('Clear all filters and queries');
            },

            clearFilters(name) {
                this.status = { state: states.Loading };
                if (name) {
                    this.filters = pickBy(this.filters, (value, key) => key !== name);
                    this.filterSummary = this.filterSummary.filter(i => i.name !== name);
                    if (name === 'q') {
                        this.activeQuery = null;
                    }
                    this.trackUi('Clear filter', name);
                } else {
                    this.sort.activeSort = null;
                    this.filters = {};
                    this.filters.q = this.activeQuery; // reset query
                    // remove everything except the query from the summary
                    this.filterSummary = this.filterSummary.filter(i => i.name === 'q');
                    this.trackUi('Clear all filters');
                }
            },

            handleSuggestion(suggestedQuery) {
                this.trackUi('Spelling suggestion', `${this.activeQuery} => ${suggestedQuery}`);
                this.activeQuery = suggestedQuery;
                this.filterResults();
            },

            storeSearchPath(filters) {
                if (filters.length > 0) {
                    setWithExpiry({
                        type: 'localStorage',
                        key: STORAGE_KEY,
                        data: filters,
                        expiryInMinutes: 60
                    });
                } else {
                    canStore && window.localStorage.removeItem(STORAGE_KEY);
                }
            },

            filterResults() {
                const combinedFilters = cloneDeep(this.filters);

                if (this.activeQuery) {
                    combinedFilters.q = trim(this.activeQuery);
                    this.handleActiveFilter({ label: this.activeQuery || undefined, name: 'q' });
                } else {
                    // Clear the filter if necessary
                    this.filters.q = undefined;
                    this.filterSummary = this.filterSummary.filter(i => i.name !== 'q');
                }

                if (this.sort.activeSort && this.sort.activeSort !== this.sort.defaultSort) {
                    combinedFilters.sort = this.sort.activeSort;
                }

                const newQueryString = queryString.stringify(combinedFilters);

                const urlPath = newQueryString
                    ? `${window.location.pathname}?${newQueryString}`
                    : window.location.pathname;

                this.storeSearchPath(newQueryString);

                this.updateResults(urlPath, newQueryString);
            },

            handleChangeSort(newSort) {
                this.sort.activeSort = newSort;
                this.filterResults();
                this.trackUi('Sort results', newSort);
            },

            updateResults(urlPath, queryString = null) {
                this.status = { state: states.Loading };

                // Hide server-rendered results
                if (!this.resultsWereFiltered) {
                    this.resultsWereFiltered = true;
                }

                if (window.history.pushState) {
                    window.history.pushState({ urlPath: urlPath }, '', urlPath);
                }

                if (this.currentRequest) {
                    this.currentRequest.abort();
                }

                this.currentRequest = $.ajax({
                    url: urlPath,
                    dataType: 'json',
                    timeout: 20000,
                    success: response => {
                        this.resultsHtml = response.resultsHtml;
                        this.totalResults = response.meta.totalResults;
                        this.totalAwarded = response.meta.totalAwarded;
                        this.facets = response.facets;
                        this.searchSuggestions = assign({}, response.searchSuggestions);
                        this.sort = response.meta.sort;
                        this.status = { state: states.Success, data: response };

                        if (this.totalResults === 0) {
                            this.trackUi('No results', queryString);
                        }
                    },
                    error: (jqXhr, textStatus, errorThrown) => {
                        if (textStatus === 'timeout') {
                            this.status = { state: states.Failure };
                            this.trackUi('Search error', 'Request timed out');
                        } else if (textStatus === 'abort') {
                            // Request cancelled because the query was changed or filters were cleared mid-request
                            // we can fail silently here and allow the next request to take precedence
                        } else {
                            // @ts-ignore
                            const errMsg = errorThrown.responseJSON.error;
                            this.status = { state: states.Failure, error: errMsg };
                            this.trackUi('Search error', errMsg);
                        }
                    }
                });
            }
        }
    });
}

export default {
    init
};
