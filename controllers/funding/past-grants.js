'use strict';

/**
 * Pre-set GrantNav Facets
 * json_query format, used to pre-select The Big Lottery Fund
 */
const grantNavFacets = {
    query: {
        bool: {
            filter: [
                {
                    bool: {
                        should: [
                            {
                                term: {
                                    'fundingOrganization.id_and_name': '["The Big Lottery Fund", "360G-blf"]'
                                }
                            }
                        ]
                    }
                },
                { bool: { should: [] } },
                { bool: { should: [], must: {} } },
                { bool: { should: { range: { amountAwarded: {} } }, must: {} } },
                { bool: { should: [] } },
                { bool: { should: [] } },
                { bool: { should: [] } },
                { bool: { should: [] } }
            ],
            must: { query_string: { default_field: '_all', query: 'Children' } }
        }
    },
    sort: { _score: { order: 'desc' } },
    aggs: {
        currency: { terms: { size: 3, field: 'currency' } },
        recipientDistrictName: { terms: { size: 3, field: 'recipientDistrictName' } },
        fundingOrganization: { terms: { size: 3, field: 'fundingOrganization.id_and_name' } },
        recipientRegionName: { terms: { size: 3, field: 'recipientRegionName' } },
        recipientOrganization: { terms: { size: 3, field: 'recipientOrganization.id_and_name' } }
    },
    extra_context: { awardYear_facet_size: 3, amountAwardedFixed_facet_size: 3 }
};

function init({ router, routeConfig }) {
    router.get(routeConfig.path, (req, res) => {
        const copy = req.i18n.__(routeConfig.lang);

        res.render(routeConfig.template, {
            copy,
            title: copy.title,
            grantNavFacets
        });
    });
}

module.exports = {
    init
};
