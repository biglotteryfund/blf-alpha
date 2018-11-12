<script>
import $ from 'jquery';
import find from 'lodash/find';

export default {
    props: ['limit', 'excludeId', 'programme', 'beneficiaryLocation'],
    data() {
        return {
            relatedGrants: undefined
        };
    },
    mounted: function() {
        this.getRelatedGrants();
    },
    methods: {
        getRelatedGrants() {
            let geocode;
            if (this.beneficiaryLocation) {
                let loc = find(JSON.parse(this.beneficiaryLocation), location => location.geoCodeType === 'CMLAD');
                if (loc) {
                    geocode = loc.geoCode;
                }
            }

            $.ajax({
                url: `${window.AppConfig.localePrefix}/funding/grants/related`,
                dataType: 'json',
                data: {
                    limit: this.limit,
                    programme: this.programme,
                    exclude: this.excludeId,
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
    }
};
</script>

<template>
    <div v-html="relatedGrants"></div>
</template>
