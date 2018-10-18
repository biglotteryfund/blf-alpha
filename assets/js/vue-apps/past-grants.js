import $ from 'jquery';
import Vue from 'vue';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import queryString from 'query-string';

import GrantsFilters from './components/grants-filters.vue';
import GrantsSort from './components/grants-sort.vue';
import GrantsTotalSummary from './components/grants-total-summary.vue';
import GrantsLoadingStatus from './components/grants-loading-status.vue';
import GrantsNoResults from './components/grants-no-results.vue';

const states = {
    NotAsked: 'NotAsked',
    Loading: 'Loading',
    Failure: 'Failure',
    Success: 'Success'
};

const sorts = {
    default: { type: 'awardDate', direction: 'desc' },
    defaultQuery: { type: 'score', direction: 'desc' }
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

            return {
                status: { state: states.NotAsked },
                defaultSort: sorts.default,
                facets: get(initialData, 'facets', {}),
                sort: get(initialData, 'sort', {}),
                filters: get(initialData, 'queryParams', {}) || {},
                totalResults: initialData.totalResults || 0,
                totalAwarded: initialData.totalAwarded || 0
            };
        },
        watch: {
            sort: {
                handler() {
                    this.filterResults();
                },
                deep: true
            },
            filters: {
                handler() {
                    this.filterResults();
                },
                deep: true
            }
        },
        mounted() {
            window.onpopstate = event => {
                const historyUrlPath = get(event, 'state.urlPath');
                historyUrlPath && this.updateResults(historyUrlPath);
            };
        },
        methods: {
            debounceQuery: debounce(function(e) {
                this.filters.q = e.target.value;
                this.defaultSort = sorts.defaultQuery;
                this.sort = sorts.defaultQuery;
                this.filterResults();
            }, 500),

            handleSort(newSort) {
                this.sort = newSort;
            },

            // Reset the filters back to their default state
            clearFilters(key) {
                if (key) {
                    delete this.filters[key];
                } else {
                    this.filters = {};
                }

                this.defaultSort = sorts.default;
                this.sort = sorts.default;

                this.filterResults();
            },

            filterResults() {
                const includeSort =
                    this.sort.type !== this.defaultSort.type && this.sort.direction !== this.defaultSort.direction;

                const combinedFilters = cloneDeep(this.filters);

                if (includeSort) {
                    combinedFilters.sort = `${this.sort.type}|${this.sort.direction}`;
                }

                const newQueryString = queryString.stringify(combinedFilters);

                const urlPath = newQueryString
                    ? `${window.location.pathname}?${newQueryString}`
                    : window.location.pathname;

                this.updateResults(urlPath);
            },

            updateResults(urlPath) {
                this.status = { state: states.Loading };
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
                        this.status = { state: states.Success, data: response };

                        if (window.history.pushState) {
                            window.history.pushState({ urlPath: urlPath }, '', urlPath);
                        }
                    })
                    .catch(err => {
                        // @ts-ignore
                        this.status = { state: states.Failure, error: err.responseJSON.error };
                    });
            }
        }
    });
}

export default {
    init
};
