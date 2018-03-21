const querystring = require('querystring');
const Raven = require('raven');
const { noCache } = require('../../middleware/cached');
const { customEvent } = require('../../modules/analytics');
const { normaliseQuery } = require('../../modules/urls');

function init({ router, routeConfig }) {
    const queryBase = 'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk';
    router.get(routeConfig.path, noCache, (req, res) => {
        req.query = normaliseQuery(req.query);

        if (req.query.q) {
            customEvent('Search', 'Term', req.query.q);
            // debug: send search logs to Sentry to work out where extra searches come from
            Raven.captureMessage('Search term', {
                level: 'info',
                extra: {
                    query: req.query.q,
                },
                tags: {
                    feature: 'search'
                }
            });
            res.redirect(`${queryBase}+${querystring.escape(req.query.q)}`);
        } else {
            res.redirect('/');
        }
    });
}

module.exports = {
    init
};
