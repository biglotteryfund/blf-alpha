import $ from 'jquery';
import Vue from 'vue';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';

import GrantFilters from './components/grant-filters.vue';
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
            'grant-filters': GrantFilters,
            'grants-total-summary': GrantsTotalSummary,
            'grant-loading-status': GrantLoadingStatus
        },
        data() {
            // Populate data from global object (eg. to share server/client state)
            const PGS = window._PAST_GRANTS_SEARCH;
            const queryParams = PGS && PGS.queryParams ? PGS.queryParams : {};
            const existingFacets = PGS && PGS.facets ? PGS.facets : {};
            const existingSort = PGS && PGS.sort ? PGS.sort : {};

            const defaultFilters = {
                amount: '',
                year: '',
                programme: '',
                country: '',
                localAuthority: '',
                constituency: ''
            };

            return {
                defaultFilters,
                sort: Object.assign({}, existingSort),
                ignoreSort: false,
                facets: Object.assign({}, existingFacets),
                filters: Object.assign({}, defaultFilters, queryParams),
                isCalculating: false,
                totalResults: PGS.totalResults || 0,
                totalAwarded: PGS.totalAwarded || 0,
                searchError: false
            };
        },
        watch: {
            filters: {
                handler() {
                    // Watch for changes to filters then make AJAX call
                    this.ignoreSort = !!this.filters.q;
                    this.isCalculating = true;
                    this.filterResults();
                },
                deep: true
            }
        },
        mounted: function() {
            // Enable inputs (they're disabled by default to avoid double inputs for non-JS users)
            $(this.$el)
                .find('[disabled]')
                .removeAttr('disabled');
        },
        methods: {
            // Create the sort parameters
            sortData: function(sortKey, currentDirection) {
                // Flip reverse it
                this.ignoreSort = false;
                let direction = currentDirection === 'asc' ? 'desc' : 'asc';
                this.sort = {
                    type: sortKey,
                    direction: direction
                };
                this.filters.sort = `${sortKey}|${direction}`;
                this.isCalculating = true;
                this.filterResults();
            },

            // Generate CSS classes for sort links
            sortLinkClasses: function(sortKey) {
                if (this.ignoreSort) {
                    return;
                }
                const type = this.sort.type;
                const dir = this.sort.direction;
                return {
                    'is-active': type === sortKey,
                    'is-descending': type === sortKey && dir === 'desc',
                    'is-ascending': type === sortKey && dir === 'asc'
                };
            },

            getSortTitle: function(ascTitle, descTitle) {
                if (this.sort.direction === 'asc') {
                    return ascTitle;
                }
                return descTitle;
            },

            // Convert filters into URL-friendly state
            filtersToString: function() {
                const filterClone = cloneDeep(this.filters);
                const cleanFilters = this.ignoreSort && filterClone.sort ? omit(filterClone, 'sort') : filterClone;
                return Object.keys(cleanFilters)
                    .filter(key => !!filterClone[key])
                    .map(key => {
                        return `${encodeURIComponent(key)}=${encodeURIComponent(filterClone[key])}`;
                    })
                    .join('&');
            },

            // Reset the filters back to their default state
            clearFilters: function(key) {
                if (key) {
                    this.filters[key] = this.defaultFilters[key];
                } else {
                    this.filters = Object.assign({}, this.defaultFilters);
                }
                this.filterResults();
            },

            // Push URL state (@TODO support back/forward nav)
            updateUrl: function() {
                if (window.history.pushState) {
                    const newURL = new URL(window.location.href);
                    newURL.search = `?${this.filtersToString()}`;
                    window.history.pushState({ path: newURL.href }, '', newURL.href);
                }
            },

            // Send the data to the AJAX endpoint and output the results to the page
            filterResults: debounce(function() {
                this.searchError = false;

                setTimeout(() => {
                    const $form = $(this.$el);
                    const url = $form.attr('action');
                    const urlWithParams = `${url}?${this.filtersToString()}`;
                    $.ajax({
                        url: urlWithParams,
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
                }, 500);
            }, 500)
        }
    });
}

export default {
    init
};
