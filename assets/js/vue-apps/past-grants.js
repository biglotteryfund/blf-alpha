import $ from 'jquery';
import Vue from 'vue';
import assign from 'lodash/assign';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';

import GrantFilters from './components/grant-filters.vue';
import GrantsSort from './components/grants-sort.vue';
import GrantsTotalSummary from './components/grants-total-summary.vue';
import GrantLoadingStatus from './components/grant-loading-status.vue';

function init() {
    const mountEl = document.getElementById('js-past-grants');
    if (!mountEl) {
        return;
    }

    new Vue({
        el: mountEl,
        components: {
            'grants-sort': GrantsSort,
            'grant-filters': GrantFilters,
            'grants-total-summary': GrantsTotalSummary,
            'grant-loading-status': GrantLoadingStatus
        },
        data() {
            /**
             * Populate data from global object
             * eg. to share server/client state
             */
            // @ts-ignore
            const PGS = window._PAST_GRANTS_SEARCH;
            const queryParams = PGS && PGS.queryParams ? PGS.queryParams : {};
            const existingFacets = PGS && PGS.facets ? PGS.facets : {};
            const existingSort = PGS && PGS.sort ? PGS.sort : {};

            const defaultFilters = {
                sort: queryParams.q ? '' : `${existingSort.type}|${existingSort.direction}`,
                amount: '',
                year: '',
                programme: '',
                country: '',
                localAuthority: '',
                constituency: ''
            };

            return {
                defaultFilters,
                facets: assign({}, existingFacets),
                filters: assign({}, defaultFilters, queryParams),
                isCalculating: false,
                totalResults: PGS.totalResults || 0,
                totalAwarded: PGS.totalAwarded || 0,
                searchError: false
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
                if (event.state.path) {
                    this.filterResults(event.state.path);
                }
            };
        },
        methods: {
            debounceQuery: debounce(function(e) {
                this.filters.q = e.target.value;
                this.filters.sort = '';
                this.filterResults();
            }, 500),

            handleSort(sortValue) {
                this.filters.sort = sortValue;
            },

            filtersToString() {
                // Convert filters into URL-friendly state
                const filterClone = cloneDeep(this.filters);
                return Object.keys(filterClone)
                    .filter(key => !!filterClone[key])
                    .map(key => {
                        return `${encodeURIComponent(key)}=${encodeURIComponent(filterClone[key])}`;
                    })
                    .join('&');
            },

            // Reset the filters back to their default state
            clearFilters(key) {
                if (key) {
                    this.filters[key] = this.defaultFilters[key];
                } else {
                    this.filters = Object.assign({}, this.defaultFilters);
                }
                this.filterResults();
            },

            updateUrl() {
                // Push URL state (@TODO support back/forward nav)
                if (window.history.pushState) {
                    const path = `${window.location.pathname}?${this.filtersToString()}`;
                    window.history.pushState({ path: path }, '', path);
                }
            },

            // Send the data to the AJAX endpoint and output the results to the page
            filterResults(url = null) {
                this.isCalculating = true;
                this.searchError = false;

                if (!url) {
                    const $form = $(this.$el);
                    url = `${$form.attr('action')}?${this.filtersToString()}`;
                }

                $.ajax({
                    url: url,
                    dataType: 'json',
                    timeout: 20000
                })
                    .then(response => {
                        // @TODO vue-ize this
                        $('#js-grant-results').html(response.resultsHtml);
                        this.totalResults = response.meta.totalResults;
                        this.totalAwarded = response.meta.totalAwarded;
                        this.facets = response.facets;
                        this.updateUrl();
                        this.isCalculating = false;
                    })
                    .catch(err => {
                        const error = err.responseJSON.error;
                        this.isCalculating = false;
                        if (error && error.code) {
                            this.searchError = error.code;
                        } else {
                            this.searchError = true;
                        }
                    });
            }
        }
    });
}

export default {
    init
};
