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
        data: {
            facets: {}
        },
        mounted: function() {
            let facets = this.$el.getAttribute('data-facets');
            if (facets) {
                this.facets = JSON.parse(facets);
            }
        },
        methods: {
            filterResults: function() {
                const $results = $('#js-grant-results');
                const $form = $(this.$el);
                $form.find('noscript').remove();
                const url = $form.attr('action');
                const data = $form.serialize();
                $results.text('Please wait, searching...');

                $.ajax({
                    url: url,
                    type: 'POST',
                    data: data,
                    dataType: 'json',
                    success: response => {
                        if (response.status === 'success') {
                            $results.html(response.resultsHtml);
                            $('#js-count').text(response.meta.totalResults);
                            this.facets = response.facets;

                            if (window.history.pushState) {
                                const newURL = new URL(window.location.href);
                                newURL.search = `?${data}`;
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
