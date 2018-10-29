import $ from 'jquery';
import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import find from 'lodash/find';
import get from 'lodash/get';
import pickBy from 'lodash/pickBy';
import queryString from 'query-string';

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

            return {
                status: { state: states.NotAsked },
                activeQuery: initialQueryParams.q || null,
                facets: get(initialData, 'facets', {}),
                sort: get(initialData, 'sort', {}),
                filters: initialQueryParams,
                filterSummary: [],
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
                this.filterSummary = [];
            };
        },
        methods: {
            handleActiveFilter(payload) {
                const match = find(this.filterSummary, item => item.name === payload.name);
                if (!match) {
                    this.filterSummary = [].concat(this.filterSummary, [payload]);
                }
            },

            clearFilters(name) {
                this.status = { state: states.Loading };
                if (name) {
                    this.filters = pickBy(this.filters, (value, key) => key !== name);
                    this.filterSummary = this.filterSummary.filter(i => i.name !== name);
                } else {
                    this.sort.activeSort = null;
                    this.filters = {};
                    this.filterSummary = [];
                    this.activeQuery = null;
                }
                this.filterResults();
            },

            updateQuery() {
                this.filters.q = this.activeQuery;
                this.handleActiveFilter({ label: this.activeQuery, name: 'q' });
                this.filterResults();
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

                this.updateResults(urlPath);
            },

            handleChangeSort(newSort) {
                this.sort.activeSort = newSort;
                this.filterResults();
            },

            updateResults(urlPath) {
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
