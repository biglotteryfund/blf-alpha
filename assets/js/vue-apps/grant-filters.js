import $ from 'jquery';
import Vue from 'vue';

function init() {
    const mountEl = document.getElementById('js-grant-filters');
    if (!mountEl) {
        return;
    }
    new Vue({
        el: mountEl,
        delimiters: ['<%', '%>'],
        data() {
            let facets = {};
            let defaultFilters = {
                amount: '',
                year: '',
                programme: '',
                country: '',
                localAuthority: ''
            };
            let filters = Object.assign({}, defaultFilters);
            return {
                facets,
                defaultFilters,
                filters
            };
        },
        mounted: function() {
            // Enable inputs (they're disabled by default to avoid double inputs for non-JS users)
            $(this.$el)
                .find('[disabled]')
                .removeAttr('disabled');
            // Populate the facets object
            if (window._PAST_GRANTS_SEARCH && window._PAST_GRANTS_SEARCH.facets) {
                this.facets = Object.assign({}, window._PAST_GRANTS_SEARCH.facets);
            }
            // Populate any existing query parameters
            if (
                window._PAST_GRANTS_SEARCH &&
                window._PAST_GRANTS_SEARCH.queryParams &&
                !!window._PAST_GRANTS_SEARCH.queryParams
            ) {
                this.filters = Object.assign({}, window._PAST_GRANTS_SEARCH.queryParams);
            }
        },
        methods: {
            sort: function(sortKey, direction) {
                this.filters.sort = `${sortKey}|${direction}`;
                this.filterResults();
            },
            filtersToString: function() {
                return Object.keys(this.filters)
                    .map(key => {
                        return `${encodeURIComponent(key)}=${encodeURIComponent(this.filters[key])}`;
                    })
                    .join('&');
            },
            clearFilters: function() {
                this.filters = Object.assign({}, this.defaultFilters);
                this.filterResults();
            },
            filterResults: function() {
                const $form = $(this.$el);
                const url = $form.attr('action');
                const $results = $('#js-grant-results');
                $results.text('Please wait, updating results...');
                $.ajax({
                    url: `${url}?${this.filtersToString()}`,
                    dataType: 'json',
                    success: response => {
                        if (response.status === 'success') {
                            $results.html(response.resultsHtml);
                            $('#js-count').text(response.meta.totalResults);
                            this.facets = response.facets;

                            if (window.history.pushState) {
                                const newURL = new URL(window.location.href);
                                newURL.search = `?${this.filtersToString()}`;
                                window.history.pushState({ path: newURL.href }, '', newURL.href);
                            }
                        } else {
                            alert('There was an error');
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
