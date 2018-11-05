import Vue from 'vue';
import $ from 'jquery';
import find from 'lodash/find';

function init() {
    const mountEl = document.getElementById('js-grant-related-projects');
    if (!mountEl) {
        return;
    }
    new Vue({
        el: mountEl,
        data() {
            // Populate data from global object (eg. to share server/client state)
            let PGS = window._PAST_GRANTS_SEARCH;
            return {
                grant: PGS.project,
                relatedGrants: null
            };
        },
        mounted: function() {
            let geocode;
            if (this.grant.beneficiaryLocation) {
                let loc = find(this.grant.beneficiaryLocation, location => location.geoCodeType === 'CMLAD');
                if (loc) {
                    geocode = loc.geoCode;
                }
            }

            const localePrefix = window.AppConfig.localePrefix;
            $.ajax({
                url: `${localePrefix}/funding/grants/related`,
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
                if (response.meta.totalResults > 1) {
                    this.relatedGrants = response.resultsHtml;
                }
            });
        }
    });
}

export default {
    init
};
