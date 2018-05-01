'use strict';
const querystring = require('querystring');
const { noCache } = require('../../middleware/cached');
const { customEvent } = require('../../modules/analytics');
const { normaliseQuery } = require('../../modules/urls');

function init({ router, routeConfig }) {
    const queryBase = 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk';
    router.get(routeConfig.path, noCache, (req, res) => {
        req.query = normaliseQuery(req.query);

        const redirectToSiteSearch = () => {
            res.redirect(`${queryBase}+${querystring.escape(req.query.q)}`);
        };

        if (req.query.q) {
            customEvent('Search', 'Term', req.query.q)
                .then(() => {
                    redirectToSiteSearch();
                })
                .catch(() => {
                    redirectToSiteSearch();
                });
        } else {
            res.redirect('/');
        }
    });
}

module.exports = {
    init
};
