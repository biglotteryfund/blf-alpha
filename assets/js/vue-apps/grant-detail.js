import $ from 'jquery';
import Vue from 'vue';

function init() {
    const mountEl = document.getElementById('js-grant-related-projects');
    if (!mountEl) {
        return;
    }
    new Vue({
        el: mountEl,
        delimiters: ['<%', '%>'],
        data() {
            return {
                relatedGrants: false
            };
        },
        mounted: function() {
            $.ajax({
                url: '/funding/search-past-grants-alpha/',
                dataType: 'json',
                data: {
                    limit: 3,
                    programme: 'Reaching Communities',
                    localAuthority: 'E08000012',
                    exclude: '0031045037',
                    fuzzy: true,
                    skipFacets: true,
                    related: true
                },
                timeout: 20000
            })
            .then(response => {
                this.relatedGrants = response.resultsHtml
            });
            // @TODO catch errors
        }
    });
}

export default {
    init
};
