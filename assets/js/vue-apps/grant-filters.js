import $ from 'jquery';
import Vue from 'vue';

import assign from 'lodash/assign';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import omit from 'lodash/omit';

function init() {
    const mountEl = document.getElementById('js-grant-filters');
    if (!mountEl) {
        return;
    }

    new Vue({
        el: mountEl,
        delimiters: ['<%', '%>'],
        data() {
            // Populate data from global object (eg. to share server/client state)
            const initialState = window._PAST_GRANTS_SEARCH;

            const queryParams = get(initialState, 'queryParams', {});
            const existingFacets = get(initialState, 'facets', {});
            const existingSort = get(initialState, 'sort', {});

            let previousFilters = {};
            try {
                const item = sessionStorage.getItem('biglotteryfund:grant-facets');
                previousFilters = item && JSON.parse(item);
            } catch (error) {} // eslint-disable-line

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
                previousFilters,
                sort: cloneDeep(existingSort),
                ignoreSort: false,
                facets: cloneDeep(existingFacets),
                filters: assign({}, defaultFilters, previousFilters, queryParams),
                isCalculating: false,
                totalResults: initialState.totalResults || 0,
                totalAwarded: initialState.totalAwarded || 0,
                searchError: false
            };
        },
        watch: {
            // Watch for changes to filters then make AJAX call
            filters: {
                handler: function() {
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

            if (this.previousFilters) {
                this.updateUrl();
            }
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

            getSortTitle(ascTitle, descTitle) {
                return this.sort.direction === 'asc' ? ascTitle : descTitle;
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

            storeState() {
                try {
                    sessionStorage.setItem('biglotteryfund:grant-facets', JSON.stringify(this.filters));
                } catch (error) {} // eslint-disable-line
            },

            updateUrl() {
                // Push URL state (@TODO support back/forward nav)
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
                            this.storeState();
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
