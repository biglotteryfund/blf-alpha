import $ from 'jquery';
import Vue from 'vue';
import _ from 'lodash';

function init() {
    const mountEl = document.getElementById('js-grant-filters');
    if (!mountEl) {
        return;
    }
    new Vue({
        el: mountEl,
        delimiters: ['<%', '%>'],
        data() {
            let PGS = window._PAST_GRANTS_SEARCH;
            let queryParams = (PGS && PGS.queryParams) ? PGS.queryParams : {};
            let existingFacets = (PGS && PGS.facets) ? PGS.facets : {};
            let defaultFilters = {
                amount: '',
                year: '',
                programme: '',
                country: '',
                localAuthority: ''
            };
            return {
                defaultFilters,
                facets: Object.assign({}, existingFacets),
                filters: Object.assign({}, defaultFilters, queryParams),
                isCalculating: false,
                totalResults: PGS.totalResults || 0
            };
        },
        watch: {
            // Watch for changes to filters then make AJAX call
            filters: {
                handler: function () {
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
            sort: function(sortKey, direction) {
                this.filters.sort = `${sortKey}|${direction}`;
                this.filterResults();
            },

            // Convert filters into URL-friendly state
            filtersToString: function() {
                return Object.keys(this.filters)
                    .map(key => {
                        return `${encodeURIComponent(key)}=${encodeURIComponent(this.filters[key])}`;
                    })
                    .join('&');
            },

            // Reset the filters back to their default state
            clearFilters: function() {
                this.filters = Object.assign({}, this.defaultFilters);
                this.filterResults();
            },

            // Redirect the user to the server-side page
            handleError: function(redirectUrl) {
                window.location = redirectUrl;
            },

            // Push URL state (@TODO support back/forward nav)
            updateUrl: function() {
                if (window.history.pushState) {
                    const newURL = new URL(window.location.href);
                    newURL.search = `?${this.filtersToString()}`;
                    window.history.pushState({ path: newURL.href }, '', newURL.href);
                }
            },

            filterResults: _.debounce(function () {
                this.isCalculating = true;
                this.updateUrl();

                setTimeout(function () {
                    const $form = $(this.$el);
                    const url = $form.attr('action');
                    const urlWithParams = `${url}?${this.filtersToString()}`;
                    $.ajax({
                        url: urlWithParams,
                        dataType: 'json',
                        success: response => {
                            if (response.status === 'success') {
                                // @TODO vue-ize this
                                $('#js-grant-results').html(response.resultsHtml);
                                this.totalResults = response.meta.totalResults;
                                this.facets = response.facets;
                            } else {
                                this.handleError(urlWithParams);
                            }
                            this.isCalculating = false;
                        },
                        timeout: 20000,
                        error: function() {
                            this.handleError(urlWithParams);
                        }
                    });
                }.bind(this), 1000);
            }, 500),

        }
    });
}

export default {
    init
};
