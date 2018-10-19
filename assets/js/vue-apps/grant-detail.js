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
            // Populate data from global object (eg. to share server/client state)
            let PGS = window._PAST_GRANTS_SEARCH;
            return {
                grant: PGS.project,
                relatedGrants: false
            };
        },
        mounted: function() {
            let geocode;
            if (this.grant.beneficiaryLocation) {
                let loc = this.grant.beneficiaryLocation.find(l => l.geoCodeType === 'CMLAD');
                if (loc) {
                    geocode = loc.geoCode;
                }
            }

            $.ajax({
                url: '/funding/search-past-grants-alpha/',
                dataType: 'json',
                data: {
                    limit: 3,
                    programme: this.grant.grantProgramme[0].title,
                    exclude: this.grant.id,
                    localAuthority: geocode,
                    related: true
                },
                timeout: 20000
            }).then(response => {
                if (response.meta.totalResults > 0) {
                    this.relatedGrants = response.resultsHtml;
                }
            });
        }
    });
}

export default {
    init
};
